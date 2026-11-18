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
IF OBJECT_ID ('dbo.Plan_Estudio') IS NOT NULL
DROP TABLE dbo.Plan_Estudio
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
        --0 = todavia no se captura el numero real de alumnos (la pagina lo pide como minimo 1 al editar)
        CONSTRAINT CK_Grupo_CantidadAlumnos CHECK (CantidadAlumnos BETWEEN 0 AND 100),
    id_carrera int not null,
    --las participaciones YA NO se guardan aqui (era un contador que se podia desfasar), se calculan
    --contando las filas de Encuesta de las clases del grupo (Encuesta > Clave_Acceso > Clase > Grupo)
    CONSTRAINT FK_Grupo_Carrera FOREIGN KEY (id_carrera) REFERENCES dbo.Carrera (id_carrera)
);
GO

--=====================================
-- 3. TABLA ASIGNATURA (solo el catalogo de nombres)
-- La asignatura YA NO lleva carrera ni cuatrimestre. Eso lo tiene el GRUPO.
-- Crear una asignatura es solo ponerle nombre, y el nombre no se repite.
--=====================================
CREATE TABLE dbo.Asignatura(
    id_asignatura int not null CONSTRAINT PK_Asignatura PRIMARY KEY,
    NomAsignatura varchar(60) not null CONSTRAINT UQ_Asignatura_Nombre UNIQUE
);
GO

--=====================================
-- 3.1 TABLA PLAN_ESTUDIO (mapa curricular: que asignaturas toca en cada carrera y cuatrimestre)
-- Es la tabla que le dice a la pagina que materias ofrecer cuando eliges un grupo:
-- el grupo ya trae su carrera y su cuatrimestre, entonces se buscan aqui solitas.
-- Asi una materia que comparten varias carreras (tronco comun) existe UNA sola vez en Asignatura.
--=====================================
CREATE TABLE dbo.Plan_Estudio(
    id_carrera int not null,
    Cuatrimestre tinyint not null
        CONSTRAINT CK_Plan_Cuatrimestre CHECK (Cuatrimestre BETWEEN 1 AND 11),
    id_asignatura int not null,
    CONSTRAINT PK_Plan_Estudio PRIMARY KEY (id_carrera, Cuatrimestre, id_asignatura),
    CONSTRAINT FK_Plan_Carrera FOREIGN KEY (id_carrera) REFERENCES dbo.Carrera (id_carrera),
    CONSTRAINT FK_Plan_Asignatura FOREIGN KEY (id_asignatura) REFERENCES dbo.Asignatura (id_asignatura)
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
    CONSTRAINT FK_Clase_Docente FOREIGN KEY (id_docente) REFERENCES dbo.Docente (id_docente),
    --una materia solo tiene un docente en cada grupo
    CONSTRAINT UQ_Clase_Grupo_Asignatura UNIQUE (id_grupo, id_asignatura)
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
-- Activo = 1 el alumno puede entrar, Activo = 0 el codigo esta DESACTIVADO (el admin lo puede volver a activar)
-- ya no hay "revocar": desactivar hace lo mismo pero se puede deshacer y no se pierde el codigo
--=====================================
CREATE TABLE dbo.Clave_Acceso(
    id_acceso int not null CONSTRAINT PK_Clave_Acceso PRIMARY KEY,
    id_clase int not null,
    Codigo varchar(6) not null CONSTRAINT UQ_ClaveAcceso_Codigo UNIQUE,
    Activo bit not null CONSTRAINT DF_ClaveAcceso_Activo DEFAULT (1),
    FechaCreacion datetime not null CONSTRAINT DF_ClaveAcceso_Fecha DEFAULT (GETDATE()),
    CONSTRAINT FK_ClaveAcceso_Clase FOREIGN KEY (id_clase) REFERENCES dbo.Clase (id_clase)
);
GO

--=====================================
-- 9. TABLA ENCUESTA (FK a Clave_Acceso)
-- una fila = un alumno que contesto la encuesta de una clase
--=====================================
CREATE TABLE dbo.Encuesta(
    id_encuesta int not null CONSTRAINT PK_Encuesta PRIMARY KEY,
    --si no mandan fecha se pone la fecha y hora actual solita
    FechaEncuesta datetime not null CONSTRAINT DF_Encuesta_Fecha DEFAULT (GETDATE()),
    --el comentario del alumno es de maximo 300 letras (igual que en la pagina)
    Comentario varchar(300) null,
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
    Texto varchar(250) not null,
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
INSERT INTO dbo.Grupo (id_grupo, ClaveGrupo, Cuatrimestre, CantidadAlumnos, id_carrera) VALUES
(1, 'GTID241', 4, 0, 1),
(2, 'GTID242', 4, 0, 1),
(3, 'GTID243', 4, 0, 1),
(4, 'GTID244', 4, 0, 1)
GO

----------------------------
-- 3. ASIGNATURA (solo el catalogo de nombres, SIN carrera ni cuatrimestre)
-- el mapa curricular tenia 220 filas y muchas materias se repetian entre carreras (tronco comun),
-- ahora cada materia va UNA sola vez: 101 asignaturas
-- formato: (id, nombre)
----------------------------
INSERT INTO dbo.Asignatura (id_asignatura, NomAsignatura) VALUES
(1, 'Inglés I'),
(2, 'Desarrollo Humano y Valores'),
(3, 'Fundamentos Matemáticos'),
(4, 'Fundamentos de Redes'),
(5, 'Física'),
(6, 'Fundamentos de Programación'),
(7, 'Comunicación y Habilidades Digitales'),
(8, 'Inglés II'),
(9, 'Habilidades Socioemocionales y Manejo de Conflictos'),
(10, 'Cálculo Diferencial'),
(11, 'Conmutación y Enrutamiento de Redes'),
(12, 'Probabilidad y Estadística'),
(13, 'Programación Estructurada'),
(14, 'Sistemas Operativos'),
(15, 'Inglés III'),
(16, 'Desarrollo del Pensamiento y Toma de Decisiones'),
(17, 'Cálculo Integral'),
(18, 'Tópicos de Calidad para el Diseño de Software'),
(19, 'Bases de Datos'),
(20, 'Programación Orientada a Objetos'),
(21, 'Proyecto Integrador I'),
(22, 'Inglés IV'),
(23, 'Ética Profesional'),
(24, 'Cálculo de Varias Variables'),
(25, 'Aplicaciones Web'),
(26, 'Estructura de Datos'),
(27, 'Desarrollo de Aplicaciones Móviles'),
(28, 'Análisis y Diseño de Software'),
(29, 'Inglés V'),
(30, 'Liderazgo de Equipos de Alto Desempeño'),
(31, 'Ecuaciones Diferenciales'),
(32, 'Aplicaciones Web Orientadas a Servicios'),
(33, 'Bases de Datos Avanzadas'),
(34, 'Estándares y Métricas para el Desarrollo de Software'),
(35, 'Proyecto Integrador II'),
(36, 'Inglés VI'),
(37, 'Habilidades Gerenciales'),
(38, 'Formulación de Proyectos de Tecnología'),
(39, 'Fundamentos de Inteligencia Artificial'),
(40, 'Ética y Legislación en Tecnologías de la Información'),
(41, 'Optativa I'),
(42, 'Seguridad Informática'),
(43, 'Inglés VII'),
(44, 'Electrónica Digital'),
(45, 'Gestión de Proyectos de Tecnología'),
(46, 'Programación para Inteligencia Artificial'),
(47, 'Administración de Servidores'),
(48, 'Optativa II'),
(49, 'Informática Forense'),
(50, 'Inglés VIII'),
(51, 'Internet de las Cosas'),
(52, 'Evaluación de Proyectos de Tecnología'),
(53, 'Ciencia de Datos'),
(54, 'Tecnologías Disruptivas'),
(55, 'Optativa III'),
(56, 'Proyecto Integrador III'),
(57, 'Escalabilidad de Redes'),
(58, 'Programación de Redes'),
(59, 'Centro de Datos'),
(60, 'Infraestructura de Redes de Datos'),
(61, 'Conexión de Redes WAN'),
(62, 'Cómputo en la Nube'),
(63, 'Seguridad en Redes'),
(64, 'Ciberseguridad Informática'),
(65, 'Modelado y Animación Digital'),
(66, 'Diseño Digital y Producción Audiovisual'),
(67, 'Mercadotecnia Digital'),
(68, 'Aplicaciones para Realidad Aumentada'),
(69, 'Aplicaciones para Realidad Virtual'),
(70, 'Frameworks para Desarrollo Web'),
(71, 'Fundamentos de Diseño y del Lenguaje Visual'),
(72, 'Representación Visual'),
(73, 'Comunicación Gráfica'),
(74, 'Geometría Descriptiva'),
(75, 'Modelado Manual'),
(76, 'Representación Geométrica'),
(77, 'Mercadotecnia'),
(78, 'Prototipos y Software 3D'),
(79, 'Proceso de Diseño'),
(80, 'Guionismo y Storyboard'),
(81, 'Fotografía y Video'),
(82, 'Diseño Editorial y Publicidad Digital'),
(83, 'Animación 2D'),
(84, 'Animación 3D'),
(85, 'Edición de Audio y Video'),
(86, 'Imagen Digital Animada'),
(87, 'Gestión Creativa'),
(88, 'Semiótica y Hermenéutica'),
(89, 'Desarrollo de Personajes 3D'),
(90, 'Metodología del Diseño'),
(91, 'Diseño de Interfaz Gráfica'),
(92, 'Animación 2D Avanzada'),
(93, 'Diseño Sonoro'),
(94, 'Rigging 3D'),
(95, 'Producción Audiovisual'),
(96, 'Estrategias Publicitarias'),
(97, 'Gestión de Proyectos'),
(98, 'Identidad Visual'),
(99, 'Composición y Efectos Visuales'),
(100, 'Animación de Personajes 3D'),
(101, 'Postproducción Audiovisual')
GO

----------------------------
-- 3.1 PLAN_ESTUDIO (que asignaturas toca en cada carrera y cuatrimestre)
-- el grupo trae su carrera y cuatrimestre y con esta tabla la pagina le ofrece sus materias solita
-- formato: (id_carrera, cuatrimestre, id_asignatura)
----------------------------
INSERT INTO dbo.Plan_Estudio (id_carrera, Cuatrimestre, id_asignatura) VALUES
-- Desarrollo de Software Multiplataforma - 1° cuatrimestre
(1, 1, 1),
(1, 1, 2),
(1, 1, 3),
(1, 1, 4),
(1, 1, 5),
(1, 1, 6),
(1, 1, 7),
-- Desarrollo de Software Multiplataforma - 2° cuatrimestre
(1, 2, 8),
(1, 2, 9),
(1, 2, 10),
(1, 2, 11),
(1, 2, 12),
(1, 2, 13),
(1, 2, 14),
-- Desarrollo de Software Multiplataforma - 3° cuatrimestre
(1, 3, 15),
(1, 3, 16),
(1, 3, 17),
(1, 3, 18),
(1, 3, 19),
(1, 3, 20),
(1, 3, 21),
-- Desarrollo de Software Multiplataforma - 4° cuatrimestre
(1, 4, 22),
(1, 4, 23),
(1, 4, 24),
(1, 4, 25),
(1, 4, 26),
(1, 4, 27),
(1, 4, 28),
-- Desarrollo de Software Multiplataforma - 5° cuatrimestre
(1, 5, 29),
(1, 5, 30),
(1, 5, 31),
(1, 5, 32),
(1, 5, 33),
(1, 5, 34),
(1, 5, 35),
-- Desarrollo de Software Multiplataforma - 7° cuatrimestre
(1, 7, 36),
(1, 7, 37),
(1, 7, 38),
(1, 7, 39),
(1, 7, 40),
(1, 7, 41),
(1, 7, 42),
-- Desarrollo de Software Multiplataforma - 8° cuatrimestre
(1, 8, 43),
(1, 8, 44),
(1, 8, 45),
(1, 8, 46),
(1, 8, 47),
(1, 8, 48),
(1, 8, 49),
-- Desarrollo de Software Multiplataforma - 9° cuatrimestre
(1, 9, 50),
(1, 9, 51),
(1, 9, 52),
(1, 9, 53),
(1, 9, 54),
(1, 9, 55),
(1, 9, 56),
-- Infraestructura de Redes Digitales - 1° cuatrimestre
(2, 1, 1),
(2, 1, 2),
(2, 1, 3),
(2, 1, 4),
(2, 1, 5),
(2, 1, 6),
(2, 1, 7),
-- Infraestructura de Redes Digitales - 2° cuatrimestre
(2, 2, 8),
(2, 2, 9),
(2, 2, 10),
(2, 2, 11),
(2, 2, 12),
(2, 2, 13),
(2, 2, 14),
-- Infraestructura de Redes Digitales - 3° cuatrimestre
(2, 3, 15),
(2, 3, 16),
(2, 3, 17),
(2, 3, 18),
(2, 3, 19),
(2, 3, 20),
(2, 3, 21),
-- Infraestructura de Redes Digitales - 4° cuatrimestre
(2, 4, 22),
(2, 4, 23),
(2, 4, 24),
(2, 4, 57),
(2, 4, 58),
(2, 4, 59),
(2, 4, 60),
-- Infraestructura de Redes Digitales - 5° cuatrimestre
(2, 5, 29),
(2, 5, 30),
(2, 5, 31),
(2, 5, 35),
(2, 5, 61),
(2, 5, 62),
(2, 5, 63),
-- Infraestructura de Redes Digitales - 7° cuatrimestre
(2, 7, 36),
(2, 7, 37),
(2, 7, 38),
(2, 7, 39),
(2, 7, 40),
(2, 7, 41),
(2, 7, 64),
-- Infraestructura de Redes Digitales - 8° cuatrimestre
(2, 8, 43),
(2, 8, 44),
(2, 8, 45),
(2, 8, 46),
(2, 8, 47),
(2, 8, 48),
(2, 8, 49),
-- Infraestructura de Redes Digitales - 9° cuatrimestre
(2, 9, 50),
(2, 9, 51),
(2, 9, 52),
(2, 9, 53),
(2, 9, 54),
(2, 9, 55),
(2, 9, 56),
-- Entornos Virtuales y Negocios Digitales - 1° cuatrimestre
(3, 1, 1),
(3, 1, 2),
(3, 1, 3),
(3, 1, 4),
(3, 1, 5),
(3, 1, 6),
(3, 1, 7),
-- Entornos Virtuales y Negocios Digitales - 2° cuatrimestre
(3, 2, 8),
(3, 2, 9),
(3, 2, 10),
(3, 2, 11),
(3, 2, 12),
(3, 2, 13),
(3, 2, 14),
-- Entornos Virtuales y Negocios Digitales - 3° cuatrimestre
(3, 3, 15),
(3, 3, 16),
(3, 3, 17),
(3, 3, 18),
(3, 3, 19),
(3, 3, 20),
(3, 3, 21),
-- Entornos Virtuales y Negocios Digitales - 4° cuatrimestre
(3, 4, 22),
(3, 4, 23),
(3, 4, 24),
(3, 4, 25),
(3, 4, 65),
(3, 4, 66),
(3, 4, 67),
-- Entornos Virtuales y Negocios Digitales - 5° cuatrimestre
(3, 5, 29),
(3, 5, 30),
(3, 5, 31),
(3, 5, 35),
(3, 5, 68),
(3, 5, 69),
(3, 5, 70),
-- Entornos Virtuales y Negocios Digitales - 7° cuatrimestre
(3, 7, 36),
(3, 7, 37),
(3, 7, 38),
(3, 7, 39),
(3, 7, 40),
(3, 7, 41),
(3, 7, 42),
-- Entornos Virtuales y Negocios Digitales - 8° cuatrimestre
(3, 8, 43),
(3, 8, 44),
(3, 8, 45),
(3, 8, 46),
(3, 8, 47),
(3, 8, 48),
(3, 8, 49),
-- Entornos Virtuales y Negocios Digitales - 9° cuatrimestre
(3, 9, 50),
(3, 9, 51),
(3, 9, 52),
(3, 9, 53),
(3, 9, 54),
(3, 9, 55),
(3, 9, 56),
-- Diseño y Animación Digital - 1° cuatrimestre
(4, 1, 1),
(4, 1, 2),
(4, 1, 7),
(4, 1, 71),
(4, 1, 72),
(4, 1, 73),
-- Diseño y Animación Digital - 2° cuatrimestre
(4, 2, 8),
(4, 2, 9),
(4, 2, 74),
(4, 2, 75),
(4, 2, 76),
(4, 2, 77),
-- Diseño y Animación Digital - 3° cuatrimestre
(4, 3, 15),
(4, 3, 16),
(4, 3, 21),
(4, 3, 78),
(4, 3, 79),
(4, 3, 80),
-- Diseño y Animación Digital - 4° cuatrimestre
(4, 4, 5),
(4, 4, 22),
(4, 4, 23),
(4, 4, 81),
(4, 4, 82),
(4, 4, 83),
-- Diseño y Animación Digital - 5° cuatrimestre
(4, 5, 12),
(4, 5, 29),
(4, 5, 30),
(4, 5, 35),
(4, 5, 84),
(4, 5, 85),
(4, 5, 86),
-- Diseño y Animación Digital - 7° cuatrimestre
(4, 7, 36),
(4, 7, 37),
(4, 7, 67),
(4, 7, 87),
(4, 7, 88),
(4, 7, 89),
(4, 7, 90),
-- Diseño y Animación Digital - 8° cuatrimestre
(4, 8, 43),
(4, 8, 91),
(4, 8, 92),
(4, 8, 93),
(4, 8, 94),
(4, 8, 95),
(4, 8, 96),
-- Diseño y Animación Digital - 9° cuatrimestre
(4, 9, 50),
(4, 9, 56),
(4, 9, 97),
(4, 9, 98),
(4, 9, 99),
(4, 9, 100),
(4, 9, 101)
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
SELECT * FROM dbo.Plan_Estudio
SELECT * FROM dbo.Docente
SELECT * FROM dbo.Administrador
SELECT * FROM dbo.Pregunta ORDER BY NumPregunta

--comprobacion: deben salir Carrera 4, Grupo 4, Asignatura 101, Plan_Estudio 220, Docente 29, Administrador 1, Pregunta 12
SELECT (SELECT COUNT(*) FROM dbo.Carrera) AS Carreras,
       (SELECT COUNT(*) FROM dbo.Grupo) AS Grupos,
       (SELECT COUNT(*) FROM dbo.Asignatura) AS Asignaturas,
       (SELECT COUNT(*) FROM dbo.Plan_Estudio) AS PlanEstudio,
       (SELECT COUNT(*) FROM dbo.Docente) AS Docentes,
       (SELECT COUNT(*) FROM dbo.Administrador) AS Administradores,
       (SELECT COUNT(*) FROM dbo.Pregunta) AS Preguntas

--prueba de login del admin (debe regresar a Mar)
SELECT id_admin, NomAdmin, ApellidoPaterno
FROM dbo.Administrador
WHERE Correo = 'maarbrcs@gmail.com'
  AND Contrasena = HASHBYTES('SHA2_256', '123456789')