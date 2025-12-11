import dotenv from 'dotenv';
import express from 'express';
import sql from 'mssql';
import cors from 'cors';
import bodyParser from 'body-parser';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// CONFIGURACIÓN DE CONEXIÓN SQL SERVER
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: false, // Importante para conexiones locales
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

let isConnected = false;

const connectDB = async () => {
    try {
        await sql.connect(dbConfig);
        isConnected = true;
        console.log(':) Conectado a SQL Server (SIGHC)');
    } catch (err) {
        isConnected = false;
        console.error(':() Error conexión SQL:', err.message);
    }
};
connectDB();

// --- HELPER: TRANSACCIONES CON AUDITORÍA ---
// Modificado para pasar el objeto 'transaction' al callback y evitar bloqueos
const executeWithAudit = async (userId, actionCallback) => {
    const transaction = new sql.Transaction();
    try {
        await transaction.begin();
        
        // 1. Obtener nombre de usuario (Lectura simple fuera de txn para no ensuciar)
        const userRequest = new sql.Request(); 
        const userRes = await userRequest.query(`SELECT NombreUsuario FROM Usuarios WHERE IdUsuario = ${userId || 1}`);
        const userName = userRes.recordset[0]?.NombreUsuario || 'Sistema';

        // 2. Configurar SESSION_CONTEXT (Dentro de la transacción)
        const ctxRequest = new sql.Request(transaction);
        ctxRequest.input('CtxUserId', sql.Int, userId || 1);
        ctxRequest.input('CtxUserName', sql.NVarChar(100), userName);
        await ctxRequest.query`
            EXEC sp_set_session_context 'UsuarioID', @CtxUserId;
            EXEC sp_set_session_context 'UsuarioNombre', @CtxUserName;
        `;

        // 3. Ejecutar la acción principal pasando la Transacción activa
        // El callback DEBE crear sus requests usando: new sql.Request(transaction)
        const result = await actionCallback(transaction);

        await transaction.commit();
        return result;
    } catch (err) {
        if (transaction._begun) await transaction.rollback();
        throw err;
    }
};

// --- RUTAS API ---

app.get('/api/health', async (req, res) => {
    if (isConnected) {
        res.json({ status: 'online', database: 'SQL Server' });
    } else {
        res.status(503).json({ status: 'offline' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body; 
        const result = await sql.query`
            SELECT u.*, r.NombreRol 
            FROM Usuarios u
            INNER JOIN Roles r ON u.IdRol = r.IdRol
            WHERE u.NombreUsuario = ${username} AND u.Estado = 'A'
        `;
        
        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            res.json({
                IdUsuario: user.IdUsuario,
                NombreUsuario: user.NombreUsuario,
                NombreCompleto: user.NombreCompleto,
                IdRol: user.IdRol,
                RolNombre: user.NombreRol
            });
        } else {
            res.status(401).json({ message: 'Usuario no encontrado' });
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// DASHBOARD
app.get('/api/dashboard', async (req, res) => {
    try {
        const activePatients = await sql.query`SELECT COUNT(*) as count FROM Pacientes WHERE Estado='A'`;
        const todayCitas = await sql.query`SELECT COUNT(*) as count FROM Citas WHERE CAST(FechaCita AS DATE) = CAST(GETDATE() AS DATE)`;
        const totalConsultas = await sql.query`SELECT COUNT(*) as count FROM Consultas`;
        const totalMedicos = await sql.query`SELECT COUNT(*) as count FROM Medicos WHERE Estado='A'`;
        const diagStats = await sql.query`SELECT TOP 4 CodigoCIE10 as name, TotalCasos as cases, DescripcionCIE10 as descr FROM VW_EstadisticasDiagnosticos ORDER BY TotalCasos DESC`;

        res.json({
            patients: activePatients.recordset[0].count,
            citas: todayCitas.recordset[0].count,
            consultas: totalConsultas.recordset[0].count,
            medicos: totalMedicos.recordset[0].count,
            diagnostics: diagStats.recordset
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PACIENTES
app.get('/api/patients', async (req, res) => {
    try {
        const result = await sql.query`SELECT * FROM VW_PacientesActivos ORDER BY FechaRegistro DESC`;
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/api/patients', async (req, res) => {
    const body = req.body;
    try {
        // Pasamos 'transaction' como argumento al callback
        const result = await executeWithAudit(body.UsuarioRegistro, async (transaction) => {
            const req = new sql.Request(transaction); // Usar la transacción
            req.input('DNI', sql.VarChar(8), body.DNI);
            req.input('Nombres', sql.NVarChar(80), body.Nombres);
            req.input('Apellidos', sql.NVarChar(80), body.Apellidos);
            req.input('FechaNacimiento', sql.Date, body.FechaNacimiento);
            req.input('Sexo', sql.Char(1), body.Sexo);
            req.input('Direccion', sql.NVarChar(200), body.Direccion);
            req.input('Telefono', sql.VarChar(15), body.Telefono);
            req.input('Email', sql.VarChar(100), body.Email);
            req.input('GrupoSanguineo', sql.VarChar(5), body.GrupoSanguineo);
            req.input('UsuarioRegistro', sql.Int, body.UsuarioRegistro);
            req.output('IdPacienteOut', sql.Int);
            req.output('NroHistoriaOut', sql.VarChar(15));

            const spRes = await req.execute('SP_RegistrarPaciente');
            const newId = spRes.output.IdPacienteOut;

            // Actualizar campos extra usando la MISMA transacción
            if (newId && (body.AntecedentesFamiliares || body.AntecedentesPersonales || body.Alergias)) {
                const updateReq = new sql.Request(transaction); 
                updateReq.input('Id', sql.Int, newId);
                updateReq.input('AntFam', sql.NVarChar(sql.MAX), body.AntecedentesFamiliares);
                updateReq.input('AntPers', sql.NVarChar(sql.MAX), body.AntecedentesPersonales);
                updateReq.input('Alergias', sql.NVarChar(sql.MAX), body.Alergias);
                
                await updateReq.query`
                    UPDATE Pacientes 
                    SET AntecedentesFamiliares = @AntFam,
                        AntecedentesPersonales = @AntPers,
                        Alergias = @Alergias
                    WHERE IdPaciente = @Id
                `;
            }
            return spRes;
        });

        res.json({ 
            success: true, 
            message: `Paciente registrado: ${result.output.NroHistoriaOut}`,
            id: result.output.IdPacienteOut 
        });
    } catch (err) {
        console.error("Error Registrar Paciente:", err.message);
        res.status(400).json({ success: false, message: err.message });
    }
});

// CITAS
app.get('/api/appointments', async (req, res) => {
    try {
        const result = await sql.query`SELECT * FROM VW_AgendaMedica ORDER BY FechaCita DESC, HoraInicio ASC`;
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/api/appointments', async (req, res) => {
    try {
        const body = req.body;
        const result = await executeWithAudit(body.usuarioRegistro, async (transaction) => {
            const req = new sql.Request(transaction);
            req.input('IdPaciente', sql.Int, body.idPaciente);
            req.input('IdMedico', sql.Int, body.idMedico);
            req.input('FechaCita', sql.Date, body.fecha);
            req.input('HoraInicio', sql.VarChar, body.hora);
            req.input('MotivoConsulta', sql.NVarChar(500), body.motivo);
            req.input('TipoCita', sql.VarChar(20), body.tipo);
            req.input('UsuarioRegistro', sql.Int, body.usuarioRegistro);
            req.output('IdCitaOut', sql.Int);
            req.output('CodigoCitaOut', sql.VarChar(20));

            return await req.execute('SP_ProgramarCita');
        });

        res.json({ 
            success: true, 
            message: `Cita programada: ${result.output.CodigoCitaOut}`,
            id: result.output.IdCitaOut 
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// CONSULTAS
app.post('/api/consultations', async (req, res) => {
    const body = req.body;
    const userId = 1; 

    try {
        await executeWithAudit(userId, async (transaction) => {
            const req = new sql.Request(transaction);
            req.input('IdCita', sql.Int, body.idCita);
            req.input('PresionArterial', sql.VarChar(10), body.vitals.presion);
            req.input('Temperatura', sql.Decimal(4,1), body.vitals.temperatura);
            req.input('FrecuenciaCardiaca', sql.Int, body.vitals.fc);
            req.input('Peso', sql.Decimal(5,2), body.vitals.peso);
            req.input('Talla', sql.Decimal(5,2), body.vitals.talla);
            req.input('MotivoConsulta', sql.NVarChar(sql.MAX), body.anamnesis.motivo);
            req.input('ExamenFisico', sql.NVarChar(sql.MAX), body.anamnesis.examen);
            req.output('IdConsultaOut', sql.Int);

            const spRes = await req.execute('SP_RegistrarConsulta');
            const idConsulta = spRes.output.IdConsultaOut;

            if (idConsulta && body.diagnostico) {
                 const diagReq = new sql.Request(transaction);
                 diagReq.input('IdConsulta', sql.Int, idConsulta);
                 diagReq.input('Codigo', sql.VarChar(10), body.diagnostico.CodigoCIE10);
                 diagReq.input('Desc', sql.NVarChar(500), body.diagnostico.DescripcionDiagnostico);
                 diagReq.input('Tipo', sql.VarChar(20), body.diagnostico.TipoDiagnostico);
                 diagReq.input('Clas', sql.VarChar(20), body.diagnostico.Clasificacion);
                 
                 await diagReq.query`
                    INSERT INTO Diagnosticos (IdConsulta, CodigoCIE10, DescripcionDiagnostico, TipoDiagnostico, Clasificacion)
                    VALUES (@IdConsulta, @Codigo, @Desc, @Tipo, @Clas)
                 `;
            }
            return spRes;
        });

        res.json({ success: true, message: 'Consulta registrada exitosamente' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// MEDICAMENTOS
app.get('/api/medicamentos', async (req, res) => {
    try {
        const result = await sql.query`SELECT * FROM Medicamentos WHERE Estado='A'`;
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/api/medicamentos', async (req, res) => {
    const d = req.body;
    try {
        const request = new sql.Request();
        await request.query`
            INSERT INTO Medicamentos (
                CodigoMedicamento, NombreGenerico, NombreComercial, Presentacion, 
                Concentracion, FormaFarmaceutica, UnidadMedida, StockMinimo, 
                StockActual, PrecioUnitario, RequiereReceta
            ) VALUES (
                ${d.CodigoMedicamento}, ${d.NombreGenerico}, ${d.NombreComercial}, ${d.Presentacion},
                ${d.Concentracion}, ${d.FormaFarmaceutica}, ${d.UnidadMedida}, ${d.StockMinimo},
                ${d.StockActual}, ${d.PrecioUnitario}, ${d.RequiereReceta ? 1 : 0}
            )
        `;
        res.json({ success: true, message: 'Medicamento registrado' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// OTROS
app.get('/api/audit', async (req, res) => {
    try {
        const result = await sql.query`SELECT TOP 100 * FROM AuditLog ORDER BY FechaHora DESC`;
        res.json(result.recordset);
    } catch (err) { res.status(500).send(err.message); }
});

app.get('/api/medicos', async (req, res) => {
    try {
        const result = await sql.query`SELECT m.*, e.NombreEspecialidad FROM Medicos m JOIN Especialidades e ON m.IdEspecialidad = e.IdEspecialidad WHERE m.Estado='A'`;
        res.json(result.recordset);
    } catch (err) { res.status(500).send(err.message); }
});

app.get('/api/pacientes-simple', async (req, res) => {
    try {
        const result = await sql.query`SELECT IdPaciente, Nombres, Apellidos FROM Pacientes WHERE Estado='A'`;
        res.json(result.recordset);
    } catch (err) { res.status(500).send(err.message); }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});