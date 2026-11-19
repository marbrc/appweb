// /static/js/nucleo/catalogo-semilla.js
// Datos iniciales reales del sistema: las 4 carreras de TI, sus asignaturas (con carrera y cuatrimestre)
// y las 12 preguntas de la encuesta. Sale de los mapas curriculares. Las estadías no van porque no se evalúan.
// Si cambia un dato, se cambia SOLO aquí. datos.js lo usa para llenar el sistema la primera vez.

export const CATALOGO = {
  "carreras": [
    "Desarrollo de Software Multiplataforma",
    "Infraestructura de Redes Digitales",
    "Entornos Virtuales y Negocios Digitales",
    "Diseño y Animación Digital"
  ],
  "asignaturas": [
    {
      "id": 1,
      "nombre": "Inglés I",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 1
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 1
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 1
        },
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 1
        }
      ]
    },
    {
      "id": 2,
      "nombre": "Desarrollo Humano y Valores",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 1
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 1
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 1
        },
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 1
        }
      ]
    },
    {
      "id": 3,
      "nombre": "Fundamentos Matemáticos",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 1
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 1
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 1
        }
      ]
    },
    {
      "id": 4,
      "nombre": "Fundamentos de Redes",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 1
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 1
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 1
        }
      ]
    },
    {
      "id": 5,
      "nombre": "Física",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 1
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 1
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 1
        },
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 4
        }
      ]
    },
    {
      "id": 6,
      "nombre": "Fundamentos de Programación",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 1
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 1
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 1
        }
      ]
    },
    {
      "id": 7,
      "nombre": "Comunicación y Habilidades Digitales",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 1
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 1
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 1
        },
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 1
        }
      ]
    },
    {
      "id": 8,
      "nombre": "Inglés II",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 2
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 2
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 2
        },
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 2
        }
      ]
    },
    {
      "id": 9,
      "nombre": "Habilidades Socioemocionales y Manejo de Conflictos",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 2
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 2
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 2
        },
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 2
        }
      ]
    },
    {
      "id": 10,
      "nombre": "Cálculo Diferencial",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 2
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 2
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 2
        }
      ]
    },
    {
      "id": 11,
      "nombre": "Conmutación y Enrutamiento de Redes",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 2
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 2
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 2
        }
      ]
    },
    {
      "id": 12,
      "nombre": "Probabilidad y Estadística",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 2
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 2
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 2
        },
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 5
        }
      ]
    },
    {
      "id": 13,
      "nombre": "Programación Estructurada",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 2
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 2
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 2
        }
      ]
    },
    {
      "id": 14,
      "nombre": "Sistemas Operativos",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 2
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 2
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 2
        }
      ]
    },
    {
      "id": 15,
      "nombre": "Inglés III",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 3
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 3
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 3
        },
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 3
        }
      ]
    },
    {
      "id": 16,
      "nombre": "Desarrollo del Pensamiento y Toma de Decisiones",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 3
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 3
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 3
        },
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 3
        }
      ]
    },
    {
      "id": 17,
      "nombre": "Cálculo Integral",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 3
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 3
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 3
        }
      ]
    },
    {
      "id": 18,
      "nombre": "Tópicos de Calidad para el Diseño de Software",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 3
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 3
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 3
        }
      ]
    },
    {
      "id": 19,
      "nombre": "Bases de Datos",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 3
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 3
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 3
        }
      ]
    },
    {
      "id": 20,
      "nombre": "Programación Orientada a Objetos",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 3
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 3
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 3
        }
      ]
    },
    {
      "id": 21,
      "nombre": "Proyecto Integrador I",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 3
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 3
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 3
        },
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 3
        }
      ]
    },
    {
      "id": 22,
      "nombre": "Inglés IV",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 4
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 4
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 4
        },
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 4
        }
      ]
    },
    {
      "id": 23,
      "nombre": "Ética Profesional",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 4
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 4
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 4
        },
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 4
        }
      ]
    },
    {
      "id": 24,
      "nombre": "Cálculo de Varias Variables",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 4
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 4
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 4
        }
      ]
    },
    {
      "id": 25,
      "nombre": "Aplicaciones Web",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 4
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 4
        }
      ]
    },
    {
      "id": 26,
      "nombre": "Estructura de Datos",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 4
        }
      ]
    },
    {
      "id": 27,
      "nombre": "Desarrollo de Aplicaciones Móviles",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 4
        }
      ]
    },
    {
      "id": 28,
      "nombre": "Análisis y Diseño de Software",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 4
        }
      ]
    },
    {
      "id": 29,
      "nombre": "Inglés V",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 5
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 5
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 5
        },
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 5
        }
      ]
    },
    {
      "id": 30,
      "nombre": "Liderazgo de Equipos de Alto Desempeño",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 5
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 5
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 5
        },
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 5
        }
      ]
    },
    {
      "id": 31,
      "nombre": "Ecuaciones Diferenciales",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 5
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 5
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 5
        }
      ]
    },
    {
      "id": 32,
      "nombre": "Aplicaciones Web Orientadas a Servicios",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 5
        }
      ]
    },
    {
      "id": 33,
      "nombre": "Bases de Datos Avanzadas",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 5
        }
      ]
    },
    {
      "id": 34,
      "nombre": "Estándares y Métricas para el Desarrollo de Software",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 5
        }
      ]
    },
    {
      "id": 35,
      "nombre": "Proyecto Integrador II",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 5
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 5
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 5
        },
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 5
        }
      ]
    },
    {
      "id": 36,
      "nombre": "Inglés VI",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 7
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 7
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 7
        },
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 7
        }
      ]
    },
    {
      "id": 37,
      "nombre": "Habilidades Gerenciales",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 7
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 7
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 7
        },
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 7
        }
      ]
    },
    {
      "id": 38,
      "nombre": "Formulación de Proyectos de Tecnología",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 7
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 7
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 7
        }
      ]
    },
    {
      "id": 39,
      "nombre": "Fundamentos de Inteligencia Artificial",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 7
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 7
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 7
        }
      ]
    },
    {
      "id": 40,
      "nombre": "Ética y Legislación en Tecnologías de la Información",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 7
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 7
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 7
        }
      ]
    },
    {
      "id": 41,
      "nombre": "Optativa I",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 7
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 7
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 7
        }
      ]
    },
    {
      "id": 42,
      "nombre": "Seguridad Informática",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 7
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 7
        }
      ]
    },
    {
      "id": 43,
      "nombre": "Inglés VII",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 8
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 8
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 8
        },
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 8
        }
      ]
    },
    {
      "id": 44,
      "nombre": "Electrónica Digital",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 8
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 8
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 8
        }
      ]
    },
    {
      "id": 45,
      "nombre": "Gestión de Proyectos de Tecnología",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 8
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 8
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 8
        }
      ]
    },
    {
      "id": 46,
      "nombre": "Programación para Inteligencia Artificial",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 8
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 8
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 8
        }
      ]
    },
    {
      "id": 47,
      "nombre": "Administración de Servidores",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 8
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 8
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 8
        }
      ]
    },
    {
      "id": 48,
      "nombre": "Optativa II",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 8
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 8
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 8
        }
      ]
    },
    {
      "id": 49,
      "nombre": "Informática Forense",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 8
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 8
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 8
        }
      ]
    },
    {
      "id": 50,
      "nombre": "Inglés VIII",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 9
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 9
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 9
        },
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 9
        }
      ]
    },
    {
      "id": 51,
      "nombre": "Internet de las Cosas",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 9
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 9
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 9
        }
      ]
    },
    {
      "id": 52,
      "nombre": "Evaluación de Proyectos de Tecnología",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 9
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 9
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 9
        }
      ]
    },
    {
      "id": 53,
      "nombre": "Ciencia de Datos",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 9
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 9
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 9
        }
      ]
    },
    {
      "id": 54,
      "nombre": "Tecnologías Disruptivas",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 9
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 9
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 9
        }
      ]
    },
    {
      "id": 55,
      "nombre": "Optativa III",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 9
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 9
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 9
        }
      ]
    },
    {
      "id": 56,
      "nombre": "Proyecto Integrador III",
      "planes": [
        {
          "carrera": "Desarrollo de Software Multiplataforma",
          "cuatrimestre": 9
        },
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 9
        },
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 9
        },
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 9
        }
      ]
    },
    {
      "id": 57,
      "nombre": "Escalabilidad de Redes",
      "planes": [
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 4
        }
      ]
    },
    {
      "id": 58,
      "nombre": "Programación de Redes",
      "planes": [
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 4
        }
      ]
    },
    {
      "id": 59,
      "nombre": "Centro de Datos",
      "planes": [
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 4
        }
      ]
    },
    {
      "id": 60,
      "nombre": "Infraestructura de Redes de Datos",
      "planes": [
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 4
        }
      ]
    },
    {
      "id": 61,
      "nombre": "Conexión de Redes WAN",
      "planes": [
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 5
        }
      ]
    },
    {
      "id": 62,
      "nombre": "Cómputo en la Nube",
      "planes": [
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 5
        }
      ]
    },
    {
      "id": 63,
      "nombre": "Seguridad en Redes",
      "planes": [
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 5
        }
      ]
    },
    {
      "id": 64,
      "nombre": "Ciberseguridad Informática",
      "planes": [
        {
          "carrera": "Infraestructura de Redes Digitales",
          "cuatrimestre": 7
        }
      ]
    },
    {
      "id": 65,
      "nombre": "Modelado y Animación Digital",
      "planes": [
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 4
        }
      ]
    },
    {
      "id": 66,
      "nombre": "Diseño Digital y Producción Audiovisual",
      "planes": [
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 4
        }
      ]
    },
    {
      "id": 67,
      "nombre": "Mercadotecnia Digital",
      "planes": [
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 4
        },
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 7
        }
      ]
    },
    {
      "id": 68,
      "nombre": "Aplicaciones para Realidad Aumentada",
      "planes": [
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 5
        }
      ]
    },
    {
      "id": 69,
      "nombre": "Aplicaciones para Realidad Virtual",
      "planes": [
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 5
        }
      ]
    },
    {
      "id": 70,
      "nombre": "Frameworks para Desarrollo Web",
      "planes": [
        {
          "carrera": "Entornos Virtuales y Negocios Digitales",
          "cuatrimestre": 5
        }
      ]
    },
    {
      "id": 71,
      "nombre": "Fundamentos de Diseño y del Lenguaje Visual",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 1
        }
      ]
    },
    {
      "id": 72,
      "nombre": "Representación Visual",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 1
        }
      ]
    },
    {
      "id": 73,
      "nombre": "Comunicación Gráfica",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 1
        }
      ]
    },
    {
      "id": 74,
      "nombre": "Geometría Descriptiva",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 2
        }
      ]
    },
    {
      "id": 75,
      "nombre": "Modelado Manual",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 2
        }
      ]
    },
    {
      "id": 76,
      "nombre": "Representación Geométrica",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 2
        }
      ]
    },
    {
      "id": 77,
      "nombre": "Mercadotecnia",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 2
        }
      ]
    },
    {
      "id": 78,
      "nombre": "Prototipos y Software 3D",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 3
        }
      ]
    },
    {
      "id": 79,
      "nombre": "Proceso de Diseño",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 3
        }
      ]
    },
    {
      "id": 80,
      "nombre": "Guionismo y Storyboard",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 3
        }
      ]
    },
    {
      "id": 81,
      "nombre": "Fotografía y Video",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 4
        }
      ]
    },
    {
      "id": 82,
      "nombre": "Diseño Editorial y Publicidad Digital",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 4
        }
      ]
    },
    {
      "id": 83,
      "nombre": "Animación 2D",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 4
        }
      ]
    },
    {
      "id": 84,
      "nombre": "Animación 3D",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 5
        }
      ]
    },
    {
      "id": 85,
      "nombre": "Edición de Audio y Video",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 5
        }
      ]
    },
    {
      "id": 86,
      "nombre": "Imagen Digital Animada",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 5
        }
      ]
    },
    {
      "id": 87,
      "nombre": "Gestión Creativa",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 7
        }
      ]
    },
    {
      "id": 88,
      "nombre": "Semiótica y Hermenéutica",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 7
        }
      ]
    },
    {
      "id": 89,
      "nombre": "Desarrollo de Personajes 3D",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 7
        }
      ]
    },
    {
      "id": 90,
      "nombre": "Metodología del Diseño",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 7
        }
      ]
    },
    {
      "id": 91,
      "nombre": "Diseño de Interfaz Gráfica",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 8
        }
      ]
    },
    {
      "id": 92,
      "nombre": "Animación 2D Avanzada",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 8
        }
      ]
    },
    {
      "id": 93,
      "nombre": "Diseño Sonoro",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 8
        }
      ]
    },
    {
      "id": 94,
      "nombre": "Rigging 3D",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 8
        }
      ]
    },
    {
      "id": 95,
      "nombre": "Producción Audiovisual",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 8
        }
      ]
    },
    {
      "id": 96,
      "nombre": "Estrategias Publicitarias",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 8
        }
      ]
    },
    {
      "id": 97,
      "nombre": "Gestión de Proyectos",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 9
        }
      ]
    },
    {
      "id": 98,
      "nombre": "Identidad Visual",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 9
        }
      ]
    },
    {
      "id": 99,
      "nombre": "Composición y Efectos Visuales",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 9
        }
      ]
    },
    {
      "id": 100,
      "nombre": "Animación de Personajes 3D",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 9
        }
      ]
    },
    {
      "id": 101,
      "nombre": "Postproducción Audiovisual",
      "planes": [
        {
          "carrera": "Diseño y Animación Digital",
          "cuatrimestre": 9
        }
      ]
    }
  ],
  "preguntas": [
    {
      "num": 1,
      "texto": "El docente expone los contenidos y prácticas de su asignatura de manera clara, gradual y congruente."
    },
    {
      "num": 2,
      "texto": "El docente proporciona orientación y apoyo a los alumnos con problemas de aprendizaje."
    },
    {
      "num": 3,
      "texto": "Propicia un ambiente de confianza y de participación durante la clase."
    },
    {
      "num": 4,
      "texto": "Establece controles de evaluación del aprendizaje considerando: exámenes parciales, participación, trabajos, prácticas, etc."
    },
    {
      "num": 5,
      "texto": "El docente da seguimiento al programa, considerando los propósitos y contenidos, a fin de lograr el saber, el saber hacer y el saber ser."
    },
    {
      "num": 6,
      "texto": "El docente emplea métodos didácticos (gráficas, folletos, acetatos, ilustraciones, dinámicas de grupo o trabajos en equipo) para facilitar la comprensión de los temas."
    },
    {
      "num": 7,
      "texto": "El docente proporciona mayores referencias sobre los temas que se les dificultan a los alumnos."
    },
    {
      "num": 8,
      "texto": "El docente responde todas las preguntas formuladas por los alumnos."
    },
    {
      "num": 9,
      "texto": "El docente muestra disposición para atender a los alumnos dentro y fuera de clase para resolver y aclarar preguntas o dudas en temas que te interesen."
    },
    {
      "num": 10,
      "texto": "El nivel de dificultad de los ejemplos de clase es congruente con el de los exámenes."
    },
    {
      "num": 11,
      "texto": "El docente entra a tiempo a clase."
    },
    {
      "num": 12,
      "texto": "El docente fomenta el auto-aprendizaje o actividades de lectura."
    }
  ]
};