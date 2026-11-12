--==================================================================
-- CREAR LA BASE DE DATOS
--==================================================================
USE master
GO

--Elimina la base de datos si ya existe
IF DB_ID ('DB_EncuestaDocente') IS NOT NULL
BEGIN
    --cerramos cualquier conexion abierta para que si deje borrarla
    ALTER DATABASE DB_EncuestaDocente SET SINGLE_USER WITH ROLLBACK IMMEDIATE
    DROP DATABASE DB_EncuestaDocente --> aqui ya la estamos borrando
END
GO

CREATE DATABASE DB_EncuestaDocente
GO

USE DB_EncuestaDocente
GO

--==================================================================
-- ELIMINAMOS LAS TABLAS SI YA EXISTEN (de los hijos a los padres)
--==================================================================
IF OBJECT_ID ('dbo.Opinion') IS NOT NULL
DROP TABLE dbo.Opinion
IF OBJECT_ID ('dbo.Recuperacion') IS NOT NULL
DROP TABLE dbo.Recuperacion
IF OBJECT_ID ('dbo.Respuesta') IS NOT NULL
DROP TABLE dbo.Respuesta
IF OBJECT_ID ('dbo.Encuesta') IS NOT NULL
DROP TABLE dbo.Encuesta
IF OBJECT_ID ('dbo.Pregunta') IS NOT NULL
DROP TABLE dbo.Pregunta
IF OBJECT_ID ('dbo.Clave_Acceso') IS NOT NULL
DROP TABLE dbo.Clave_Acceso
IF OBJECT_ID ('dbo.Docente_Grupo') IS NOT NULL
DROP TABLE dbo.Docente_Grupo
IF OBJECT_ID ('dbo.Clase') IS NOT NULL
DROP TABLE dbo.Clase
IF OBJECT_ID ('dbo.Administrador') IS NOT NULL
DROP TABLE dbo.Administrador
IF OBJECT_ID ('dbo.Docente') IS NOT NULL
DROP TABLE dbo.Docente
IF OBJECT_ID ('dbo.Asignatura') IS NOT NULL
DROP TABLE dbo.Asignatura
IF OBJECT_ID ('dbo.Grupo') IS NOT NULL
DROP TABLE dbo.Grupo
IF OBJECT_ID ('dbo.Carrera') IS NOT NULL
DROP TABLE dbo.Carrera
GO

--==================================================================
-- CREAMOS LAS TABLAS (primero los padres y luego los hijos)
--==================================================================

--=====================================
-- 1. TABLA CARRERA
--=====================================
CREATE TABLE dbo.Carrera(
    id_carrera int not null CONSTRAINT PK_Carrera PRIMARY KEY,
    NomCarrera varchar(60) not null
);
GO

--=====================================
-- 2. TABLA GRUPO (FK a Carrera)
--=====================================
CREATE TABLE dbo.Grupo(
    id_grupo int not null CONSTRAINT PK_Grupo PRIMARY KEY,
    --la clave no se puede repetir, ejemplo GTID243
    ClaveGrupo varchar(7) not null CONSTRAINT UQ_Grupo_ClaveGrupo UNIQUE,
    Cuatrimestre tinyint not null
        CONSTRAINT CK_Grupo_Cuatrimestre CHECK (Cuatrimestre BETWEEN 1 AND 11),
    CantidadAlumnos int not null
        CONSTRAINT CK_Grupo_CantidadAlumnos CHECK (CantidadAlumnos >= 0),
    id_carrera int not null,
    participaciones int not null CONSTRAINT DF_Grupo_participaciones DEFAULT (0),
    CONSTRAINT FK_Grupo_Carrera FOREIGN KEY (id_carrera) REFERENCES dbo.Carrera (id_carrera)
);
GO

--=====================================
-- 3. TABLA ASIGNATURA (FK a Grupo y Carrera)
--=====================================
CREATE TABLE dbo.Asignatura(
    id_asignatura int not null CONSTRAINT PK_Asignatura PRIMARY KEY,
    NomAsignatura varchar(60) not null,
    activa BIT NOT NULL DEFAULT 1
);
GO

--=====================================
-- 4. TABLA DOCENTE
--=====================================
CREATE TABLE dbo.Docente(
    id_docente int not null CONSTRAINT PK_Docente PRIMARY KEY,
    NomDocente varchar(60) not null,
    ApellidoPaterno varchar(50) not null,
    ApellidoMaterno varchar(50) null,
    --1 = activo, 0 = inactivo (en SQL Server el BOOLEAN es BIT)
    Estatus bit not null CONSTRAINT DF_Docente_Estatus DEFAULT (1),
    --el correo es opcional por ahora porque todavia no lo tenemos
    Correo varchar(100) null
);
GO

--el correo no se puede repetir, pero si puede haber varios vacios (NULL)
CREATE UNIQUE INDEX UQ_Docente_Correo ON dbo.Docente (Correo) WHERE Correo IS NOT NULL
GO

--=====================================
-- 5. TABLA ADMINISTRADOR
-- es el usuario del sistema y su rol es administrador (puede hacer todo)
-- tiene los mismos datos que Docente pero sin asignatura
--=====================================
CREATE TABLE dbo.Administrador(
    id_admin int not null CONSTRAINT PK_Administrador PRIMARY KEY,
    NomAdmin varchar(60) not null,
    ApellidoPaterno varchar(50) not null,
    ApellidoMaterno varchar(50) null,
    --el correo es el usuario para entrar y no se puede repetir
    Correo varchar(100) not null CONSTRAINT UQ_Administrador_Correo UNIQUE,
    --la contrasena se guarda encriptada (SHA2_256) no en texto normal
    Contrasena varbinary(32) not null,
    --1 = activo, 0 = inactivo
    Estatus bit not null CONSTRAINT DF_Administrador_Estatus DEFAULT (1),
    --la foto de perfil se guarda como texto (data:image/...;base64) y es opcional
    Foto varchar(max) null,
    --cuando se registro y la ultima vez que entro, se ve en la pantalla de cuenta
    FechaRegistro datetime not null CONSTRAINT DF_Administrador_FechaRegistro DEFAULT (GETDATE()),
    UltimoAcceso datetime null
);
GO

--=====================================
-- 6. TABLA CLASE (FK a Grupo, Asignatura y Docente)
--=====================================
CREATE TABLE dbo.Clase(
    id_clase int not null CONSTRAINT PK_Clase PRIMARY KEY,
    id_grupo int not null,
    id_asignatura int not null,
    id_docente int not null,
    CONSTRAINT FK_Clase_Grupo FOREIGN KEY (id_grupo) REFERENCES dbo.Grupo (id_grupo),
    CONSTRAINT FK_Clase_Asignatura FOREIGN KEY (id_asignatura) REFERENCES dbo.Asignatura (id_asignatura),
    CONSTRAINT FK_Clase_Docente FOREIGN KEY (id_docente) REFERENCES dbo.Docente (id_docente)
);
GO

--=====================================
-- 7. TABLA DOCENTE_GRUPO (llave primaria compuesta)
--=====================================
CREATE TABLE dbo.Docente_Grupo(
    id_asignatura int not null,
    id_docente int not null,
    CONSTRAINT PK_Docente_Grupo PRIMARY KEY (id_asignatura, id_docente),
    CONSTRAINT FK_DocenteGrupo_Asignatura FOREIGN KEY (id_asignatura) REFERENCES dbo.Asignatura (id_asignatura),
    CONSTRAINT FK_DocenteGrupo_Docente FOREIGN KEY (id_docente) REFERENCES dbo.Docente (id_docente)
);
GO

--=====================================
-- 8. TABLA CLAVE_ACCESO (FK a Clase)
-- el Codigo es el de 6 letras que va en el enlace del alumno (ej. K7M2QP)
-- antes lo agregaba python solito, ahora ya viene desde aqui
--=====================================
CREATE TABLE dbo.Clave_Acceso(
    id_acceso int not null CONSTRAINT PK_Clave_Acceso PRIMARY KEY,
    id_clase int not null,
    --si el admin revoca el codigo se queda en NULL pero la fila no se borra porque las encuestas cuelgan de ella
    Codigo varchar(6) null,
    FechaCreacion datetime not null CONSTRAINT DF_ClaveAcceso_Fecha DEFAULT (GETDATE()),
    CONSTRAINT FK_ClaveAcceso_Clase FOREIGN KEY (id_clase) REFERENCES dbo.Clase (id_clase)
);
GO

--el codigo no se puede repetir pero puede haber varios NULL (los revocados)
CREATE UNIQUE INDEX UQ_ClaveAcceso_Codigo ON dbo.Clave_Acceso (Codigo) WHERE Codigo IS NOT NULL
GO

--=====================================
-- 9. TABLA ENCUESTA (FK a Clave_Acceso)
-- una fila = un alumno que contesto la encuesta de una clase
--=====================================
CREATE TABLE dbo.Encuesta(
    id_encuesta int not null CONSTRAINT PK_Encuesta PRIMARY KEY,
    --si no mandan fecha se pone la fecha y hora actual solita
    FechaEncuesta datetime not null CONSTRAINT DF_Encuesta_Fecha DEFAULT (GETDATE()),
    Comentario varchar(500) null,
    id_acceso int not null,
    CONSTRAINT FK_Encuesta_ClaveAcceso FOREIGN KEY (id_acceso) REFERENCES dbo.Clave_Acceso (id_acceso)
);
GO

--=====================================
-- 10. TABLA PREGUNTA (ya NO depende de Encuesta)
-- ANTES cada encuesta tenia sus propias 12 preguntas copiadas y no habia donde guardar
-- "las preguntas del sistema", por eso estaban en un json. Ahora Pregunta es el catalogo
-- de las 12 preguntas y la Respuesta es la que une la Pregunta con la Encuesta
--=====================================
CREATE TABLE dbo.Pregunta(
    id_pregunta int not null CONSTRAINT PK_Pregunta PRIMARY KEY,
    --el orden en que le salen al alumno
    NumPregunta tinyint not null CONSTRAINT CK_Pregunta_Num CHECK (NumPregunta > 0),
    Texto varchar(500) not null,
    --si una pregunta ya tiene respuestas no se puede borrar, solo se desactiva (Activa = 0)
    Activa bit not null CONSTRAINT DF_Pregunta_Activa DEFAULT (1)
);
GO

--=====================================
-- 11. TABLA RESPUESTA (FK a Pregunta y a Encuesta)
--=====================================
CREATE TABLE dbo.Respuesta(
    id_respuesta int not null CONSTRAINT PK_Respuesta PRIMARY KEY,
    --la escala de calificacion del sistema es del 5 al 10
    Calificacion tinyint not null
        CONSTRAINT CK_Respuesta_Calificacion CHECK (Calificacion BETWEEN 5 AND 10),
    id_pregunta int not null,
    id_encuesta int not null,
    CONSTRAINT FK_Respuesta_Pregunta FOREIGN KEY (id_pregunta) REFERENCES dbo.Pregunta (id_pregunta),
    CONSTRAINT FK_Respuesta_Encuesta FOREIGN KEY (id_encuesta) REFERENCES dbo.Encuesta (id_encuesta),
    --en una misma encuesta cada pregunta se contesta una sola vez
    CONSTRAINT UQ_Respuesta_Encuesta_Pregunta UNIQUE (id_encuesta, id_pregunta)
);
GO

--=====================================
-- 12. TABLA RECUPERACION (FK a Administrador)
-- cuando alguien olvida su contrasena se le manda un codigo de 6 numeros al correo
-- el codigo tambien se guarda encriptado y solo sirve 15 minutos y una sola vez
--=====================================
CREATE TABLE dbo.Recuperacion(
    id_recuperacion int not null CONSTRAINT PK_Recuperacion PRIMARY KEY,
    id_admin int not null,
    Codigo varbinary(32) not null,
    FechaExpira datetime not null,
    Usado bit not null CONSTRAINT DF_Recuperacion_Usado DEFAULT (0),
    CONSTRAINT FK_Recuperacion_Administrador FOREIGN KEY (id_admin) REFERENCES dbo.Administrador (id_admin)
);
GO

--=====================================
-- 13. TABLA OPINION (FK a Administrador)
-- lo que mandan en "Calificar el sistema", de 1 a 5 estrellas
--=====================================
CREATE TABLE dbo.Opinion(
    id_opinion int not null CONSTRAINT PK_Opinion PRIMARY KEY,
    Estrellas tinyint not null CONSTRAINT CK_Opinion_Estrellas CHECK (Estrellas BETWEEN 1 AND 5),
    Comentario varchar(300) null,
    FechaOpinion datetime not null CONSTRAINT DF_Opinion_Fecha DEFAULT (GETDATE()),
    --puede quedar en NULL si la manda alguien sin sesion
    id_admin int null,
    CONSTRAINT FK_Opinion_Administrador FOREIGN KEY (id_admin) REFERENCES dbo.Administrador (id_admin)
);
GO
--========================================================================
-- INSERCION DE DATOS REALES
--========================================================================
USE DB_EncuestaDocente
GO

----------------------------
-- 1. CARRERA
----------------------------
INSERT INTO dbo.Carrera (id_carrera, NomCarrera) VALUES
(1, 'Desarrollo de Software Multiplataforma'),
(2, 'Infraestructura de Redes Digitales'),
(3, 'Entornos Virtuales y Negocios Digitales'),
(4, 'Diseño y Animación Digital')
GO

----------------------------
-- 2. GRUPO (el cuatrimestre es una columna de Grupo)
-- la cantidad de alumnos queda en 0 hasta tener los numeros reales
----------------------------
INSERT INTO dbo.Grupo (id_grupo, ClaveGrupo, Cuatrimestre, CantidadAlumnos, id_carrera, participaciones) VALUES
(1, 'GTID241', 4, 0, 1, 0),
(2, 'GTID242', 4, 0, 1, 0),
(3, 'GTID243', 4, 0, 1, 0),
(4, 'GTID244', 4, 0, 1, 0)
GO

----------------------------
-- 3. ASIGNATURA
-- las 7 de 4to cuatri de Software, una vez por cada grupo
-- formato: (id, nombre, id_grupo, id_carrera)
----------------------------
INSERT INTO dbo.Asignatura (id_asignatura, NomAsignatura) VALUES
-- GTID241
(1, 'Inglés IV'),
(2, 'Ética Profesional'),
(3, 'Cálculo de Varias Variables'),
(4, 'Aplicaciones Web'),
(5, 'Estructura de Datos'),
(6, 'Desarrollo de Aplicaciones Móviles'),
(7, 'Análisis y Diseño de Software'),
-- GTID242
(8, 'Inglés IV'),
(9, 'Ética Profesional'),
(10, 'Cálculo de Varias Variables'),
(11, 'Aplicaciones Web'),
(12, 'Estructura de Datos'),
(13, 'Desarrollo de Aplicaciones Móviles'),
(14, 'Análisis y Diseño de Software'),
-- GTID243
(15, 'Inglés IV'),
(16, 'Ética Profesional'),
(17, 'Cálculo de Varias Variables'),
(18, 'Aplicaciones Web'),
(19, 'Estructura de Datos'),
(20, 'Desarrollo de Aplicaciones Móviles'),
(21, 'Análisis y Diseño de Software'),
-- GTID244
(22, 'Inglés IV'),
(23, 'Ética Profesional'),
(24, 'Cálculo de Varias Variables'),
(25, 'Aplicaciones Web'),
(26, 'Estructura de Datos'),
(27, 'Desarrollo de Aplicaciones Móviles'),
(28, 'Análisis y Diseño de Software')
GO

----------------------------
-- 4. DOCENTE (todavia sin correo, por eso queda en NULL)
----------------------------
INSERT INTO dbo.Docente (id_docente, NomDocente, ApellidoPaterno, ApellidoMaterno, Estatus) VALUES
(1, 'Anastasio', 'Rodríguez', 'García', 1),
(2, 'Juana Andrea', 'Godoy', 'Barrera', 1),
(3, 'Gabriel', 'Barrón', 'Rodríguez', 1),
(4, 'J. Refugio', 'Rubio', 'Hernández', 1),
(5, 'Daniel', 'Sustaita', 'Cruces', 1),
(6, 'Javier Jesús', 'Torres', 'Yáñez', 1),
(7, 'Apolinar', 'Trejo', 'Cuevas', 1),
(8, 'Ricardo', 'Muro', 'Gómez', 1),
(9, 'María Teresa', 'Díaz', 'Robledo', 1),
(10, 'José De Jesús Eduardo', 'Barrientos', 'Avalos', 1),
(11, 'Maricela', 'Méndez', 'Mendoza', 1),
(12, 'Víctor Noel', 'García', 'Valencia', 1),
(13, 'Gerardo', 'Parra', 'Rodríguez', 1),
(14, 'José Gerardo', 'Reyna', 'Ibarra', 1),
(15, 'Elsa Verónica', 'Martínez', 'Mejía', 1),
(16, 'Guillermo', 'Hernández', 'Ojeda', 1),
(17, 'Anireya', 'Saavedra', 'Pérez', 1),
(18, 'Julia', 'Ruíz', 'Herbert', 1),
(19, 'Estefanía', 'Salazar', 'Alcaraz', 1),
(20, 'Gerson Gastón', 'García', 'Peralta', 1),
(21, 'Maciel', 'Romo', 'Zamarrón', 1),
(22, 'Daniel Eduardo', 'Torrejón', 'Rojel', 1),
(23, 'Pamela', 'Villanueva', 'Gaytán', 1),
(24, 'Rosa Yasiris', 'Ramírez', 'Pérez', 1),
(25, 'Eric', 'Domenzain', 'Morales', 1),
(26, 'Jimena', 'Torres', 'Godínez', 1),
(27, 'Ariadna Marcela', 'Ramírez', 'Oros', 1),
(28, 'Luis Gerardo', 'Aguayo', 'López', 1),
(29, 'Javier', 'Méndez', 'Ramirez', 1)
GO

----------------------------
-- 5. ADMINISTRADOR (tu usuario, con rol administrador)
-- HASHBYTES encripta la contrasena antes de guardarla
-- python la encripta igualito (sha256) asi que con esta misma contraseña entras a la pagina
-- el apellido materno queda en NULL porque no lo tenemos
----------------------------
INSERT INTO dbo.Administrador (id_admin, NomAdmin, ApellidoPaterno, ApellidoMaterno, Correo, Contrasena, Estatus) VALUES
(1, 'Mar', 'Barcenas', NULL, 'maarbrcs@gmail.com', HASHBYTES('SHA2_256', '123456789'), 1)
GO

----------------------------
-- 6. PREGUNTA (las 12 preguntas de la encuesta, del 5 al 10)
-- ya no cuelgan de una encuesta, son el catalogo y las comparten todas las encuestas
-- formato: (id, numero, texto, activa)
----------------------------
INSERT INTO dbo.Pregunta (id_pregunta, NumPregunta, Texto, Activa) VALUES
(1, 1, 'El docente expone los contenidos y prácticas de su asignatura de manera clara, gradual y congruente.', 1),
(2, 2, 'El docente proporciona orientación y apoyo a los alumnos con problemas de aprendizaje.', 1),
(3, 3, 'Propicia un ambiente de confianza y de participación durante la clase.', 1),
(4, 4, 'Establece controles de evaluación del aprendizaje considerando: exámenes parciales, participación, trabajos, prácticas, etc.', 1),
(5, 5, 'El docente da seguimiento al programa, considerando los propósitos y contenidos, a fin de lograr el saber, el saber hacer y el saber ser.', 1),
(6, 6, 'El docente emplea métodos didácticos (gráficas, folletos, acetatos, ilustraciones, dinámicas de grupo o trabajos en equipo) para facilitar la comprensión de los temas.', 1),
(7, 7, 'El docente proporciona mayores referencias sobre los temas que se les dificultan a los alumnos.', 1),
(8, 8, 'El docente responde todas las preguntas formuladas por los alumnos.', 1),
(9, 9, 'El docente muestra disposición para atender a los alumnos dentro y fuera de clase para resolver y aclarar preguntas o dudas en temas que te interesen.', 1),
(10, 10, 'El nivel de dificultad de los ejemplos de clase es congruente con el de los exámenes.', 1),
(11, 11, 'El docente entra a tiempo a clase.', 1),
(12, 12, 'El docente fomenta el auto-aprendizaje o actividades de lectura.', 1)
GO

--==============================================================================================
-- SELECTS PARA LA EVIDENCIA
--==============================================================================================
SELECT * FROM dbo.Carrera
SELECT * FROM dbo.Grupo
SELECT * FROM dbo.Asignatura
SELECT * FROM dbo.Docente
SELECT * FROM dbo.Administrador
SELECT * FROM dbo.Pregunta ORDER BY NumPregunta

--comprobacion: deben salir Carrera 4, Grupo 4, Asignatura 28, Docente 29, Administrador 1, Pregunta 12
SELECT (SELECT COUNT(*) FROM dbo.Carrera) AS Carreras,
       (SELECT COUNT(*) FROM dbo.Grupo) AS Grupos,
       (SELECT COUNT(*) FROM dbo.Asignatura) AS Asignaturas,
       (SELECT COUNT(*) FROM dbo.Docente) AS Docentes,
       (SELECT COUNT(*) FROM dbo.Administrador) AS Administradores,
       (SELECT COUNT(*) FROM dbo.Pregunta) AS Preguntas

--prueba de login del admin (debe regresar a Mar)
SELECT id_admin, NomAdmin, ApellidoPaterno
FROM dbo.Administrador
WHERE Correo = 'maarbrcs@gmail.com'
  AND Contrasena = HASHBYTES('SHA2_256', '123456789')