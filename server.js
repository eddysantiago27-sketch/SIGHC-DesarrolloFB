
const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// CONFIGURACIÓN DE CONEXIÓN SQL SERVER
// ¡Actualiza esto con tus credenciales locales!
const dbConfig = {
    user: 'sa', // Tu usuario SQL
    password: 'your_password', // Tu contraseña SQL
    server: 'localhost', // O el nombre de tu servidor/instancia (ej: 'DESKTOP-XYZ\\SQLEXPRESS')
    database: 'SIGHC',
    options: {
        encrypt: true, // true para Azure, false para local usualmente
        trustServerCertificate: true // true para desarrollo local
    }
};

// Conectar a BD
sql.connect(dbConfig).then(pool => {
    if (pool.connected) {
        console.log('✅ Conectado a SQL Server (SIGHC)');
    }
}).catch(err => {
    console.error('❌ Error conexión SQL:', err);
});

// --- RUTAS API ---

// Login (Simulado query seguro)
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body; // Fixed: Read from body, not query
        
        // En prod: validar hash con HASHBYTES('SHA2_512', ...) en el SP o query
        const result = await sql.query`SELECT * FROM Usuarios WHERE NombreUsuario = ${username}`;
        
        if (result.recordset.length > 0) {
            // Unir con rol para nombre
            const user = result.recordset[0];
            const roleRes = await sql.query`SELECT NombreRol FROM Roles WHERE IdRol = ${user.IdRol}`;
            user.RolNombre = roleRes.recordset[0]?.NombreRol || 'Usuario';
            res.json(user);
        } else {
            res.status(401).json({ message: 'Credenciales inválidas' });
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Dashboard Stats
app.get('/api/dashboard', async (req, res) => {
    try {
        const activePatients = await sql.query`SELECT COUNT(*) as count FROM Pacientes WHERE Estado='A'`;
        const todayCitas = await sql.query`SELECT COUNT(*) as count FROM Citas WHERE CAST(FechaCita AS DATE) = CAST(GETDATE() AS DATE)`;
        const totalConsultas = await sql.query`SELECT COUNT(*) as count FROM Consultas`;
        const totalMedicos = await sql.query`SELECT COUNT(*) as count FROM Medicos WHERE Estado='A'`;
        
        // Diagnosticos frecuentes (Vista)
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

// Pacientes
app.get('/api/patients', async (req, res) => {
    try {
        const result = await sql.query`SELECT * FROM VW_PacientesActivos ORDER BY FechaRegistro DESC`;
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/api/patients', async (req, res) => {
    const { DNI, Nombres, Apellidos, FechaNacimiento, Sexo, Direccion, Telefono, Email, GrupoSanguineo, UsuarioRegistro } = req.body;
    try {
        const request = new sql.Request();
        request.input('DNI', sql.VarChar(8), DNI);
        request.input('Nombres', sql.NVarChar(80), Nombres);
        request.input('Apellidos', sql.NVarChar(80), Apellidos);
        request.input('FechaNacimiento', sql.Date, FechaNacimiento);
        request.input('Sexo', sql.Char(1), Sexo);
        request.input('Direccion', sql.NVarChar(200), Direccion);
        request.input('Telefono', sql.VarChar(15), Telefono);
        request.input('Email', sql.VarChar(100), Email);
        request.input('GrupoSanguineo', sql.VarChar(5), GrupoSanguineo);
        request.input('UsuarioRegistro', sql.Int, UsuarioRegistro);
        request.output('IdPacienteOut', sql.Int);
        request.output('NroHistoriaOut', sql.VarChar(15));

        const result = await request.execute('SP_RegistrarPaciente');
        res.json({ 
            success: true, 
            message: `Paciente registrado: ${result.output.NroHistoriaOut}`,
            id: result.output.IdPacienteOut 
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// Citas
app.get('/api/appointments', async (req, res) => {
    try {
        // Vista VW_AgendaMedica
        const result = await sql.query`SELECT * FROM VW_AgendaMedica ORDER BY FechaCita DESC, HoraInicio ASC`;
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/api/appointments', async (req, res) => {
    const { idPaciente, idMedico, fecha, hora, motivo, tipo, usuarioRegistro } = req.body;
    try {
        const request = new sql.Request();
        request.input('IdPaciente', sql.Int, idPaciente);
        request.input('IdMedico', sql.Int, idMedico);
        request.input('FechaCita', sql.Date, fecha);
        request.input('HoraInicio', sql.Time, hora);
        request.input('MotivoConsulta', sql.NVarChar(500), motivo);
        request.input('TipoCita', sql.VarChar(20), tipo);
        request.input('UsuarioRegistro', sql.Int, usuarioRegistro);
        request.output('IdCitaOut', sql.Int);
        request.output('CodigoCitaOut', sql.VarChar(20));

        const result = await request.execute('SP_ProgramarCita');
        res.json({ 
            success: true, 
            message: `Cita programada: ${result.output.CodigoCitaOut}`,
            id: result.output.IdCitaOut 
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// Consultas
app.post('/api/consultations', async (req, res) => {
    const { idCita, vitals, anamnesis } = req.body;
    try {
        const request = new sql.Request();
        request.input('IdCita', sql.Int, idCita);
        request.input('PresionArterial', sql.VarChar(10), vitals.presion);
        request.input('Temperatura', sql.Decimal(4,1), vitals.temperatura);
        request.input('FrecuenciaCardiaca', sql.Int, vitals.fc);
        request.input('Peso', sql.Decimal(5,2), vitals.peso);
        request.input('Talla', sql.Decimal(5,2), vitals.talla);
        request.input('MotivoConsulta', sql.NVarChar(sql.MAX), anamnesis.motivo);
        request.input('ExamenFisico', sql.NVarChar(sql.MAX), anamnesis.examen);
        request.output('IdConsultaOut', sql.Int);

        const result = await request.execute('SP_RegistrarConsulta');
        res.json({ success: true, message: 'Consulta registrada exitosamente' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// Auditoría
app.get('/api/audit', async (req, res) => {
    try {
        const result = await sql.query`SELECT TOP 100 * FROM AuditLog ORDER BY FechaHora DESC`;
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Helpers para listas desplegables
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
