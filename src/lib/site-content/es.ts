import type { SiteContent } from "./types";
import { helpEs } from "./help-es";

const es: SiteContent = {
  ui: {
    back: "Volver", updated: "Última actualización", onThisPage: "En esta página", contactTitle: "¿Necesitas hablar con una persona?",
    contactBody: "Cuéntanos qué pasó y qué esperabas que pasara. Mientras más claro, más rápido te ayudamos.",
    contactInApp: "Dentro de la app: Más → Ayuda y comentarios.", emailUs: "Escríbenos a", operator: "Responsable del servicio",
    helpTitle: "Centro de ayuda", helpIntro: "Respuestas cortas para el día a día: materiales, compras, propuestas, facturas y equipo.",
    searchPh: "Busca: comprar, factura, empleado, instalar…", noResults: "No encontramos nada con esa búsqueda. Prueba con otra palabra o escríbenos.",
    startTitle: "Empieza en 5 pasos",
    startSteps: [
      "Crea tu cuenta y completa los datos de tu empresa en Más → Configuración (nombre, logo, moneda, zona horaria).",
      "Agrega a tu cliente y crea el proyecto: todo lo demás cuelga del proyecto.",
      "Arma la lista de materiales. Elige “Comprar ya” para generar la orden de compra, o “Pedir cotización a suppliers” para comparar precios.",
      "Crea la propuesta para tu cliente y envíale el enlace seguro: puede aprobarla o pedir cambios sin instalar nada.",
      "Cuando el trabajo avance, factura desde la propuesta aprobada y registra los pagos que recibas.",
    ],
    legalLinks: "Información legal", terms: "Términos y condiciones", privacy: "Política de privacidad", help: "Ayuda",
    acceptNote: "Al crear tu cuenta aceptas los", helpHere: "Ayuda sobre esta pantalla", footerRights: "Todos los derechos reservados.", print: "Imprimir", topics: "Temas", related: "Relacionado",
  },
  terms: {
    title: "Términos y condiciones",
    summaryTitle: "En palabras simples",
    summary: [
      "BidPower es una herramienta para organizar tu operación: proyectos, clientes, materiales, compras, propuestas, facturas y equipo.",
      "Tus datos son tuyos. Tú decides quién de tu equipo ve qué. Tú eres responsable de lo que le envías a tus clientes y proveedores.",
      "BidPower no cobra por ti, no procesa pagos y no reemplaza a tu contador ni a tu abogado.",
    ],
    sections: [
      { id: "aceptacion", title: "1. Aceptación de los términos", body: [
        "Al crear una cuenta, iniciar sesión o usar BidPower aceptas estos términos y la Política de privacidad. Si usas BidPower en nombre de una empresa, declaras que tienes autoridad para obligarla.",
        "Si no estás de acuerdo, no uses el servicio.",
      ] },
      { id: "servicio", title: "2. Qué es BidPower y qué no es", body: [
        "BidPower es una aplicación web e instalable (PWA) para contratistas, sus equipos y sus suppliers. Permite:",
        "- Crear y controlar proyectos y clientes.",
        "- Armar listas de materiales, pedir precios a un supply y generar órdenes de compra.",
        "- Crear propuestas para clientes, compartirlas por enlace seguro y registrar su respuesta.",
        "- Registrar gastos y recibos, emitir facturas y registrar los pagos recibidos.",
        "- Invitar a empleados con permisos individuales.",
        "BidPower no es un sistema de contabilidad, no presenta impuestos, no es asesoría legal, fiscal, contable ni de ingeniería, y no es parte de ninguna transacción entre contratistas, clientes y suppliers.",
      ] },
      { id: "cuentas", title: "3. Cuentas, roles y seguridad", body: [
        "Debes dar información veraz y mantenerla al día. Eres responsable de la actividad que ocurra con tu cuenta y de proteger tu contraseña.",
        "El propietario (owner) de la cuenta de empresa decide quién pertenece a su equipo, qué rol tiene (propietario, manager o empleado) y qué permisos individuales recibe: pedir materiales, subir recibos, crear o enviar órdenes de compra, ver costos o ganancias y límites de monto. Puede cambiarlos o desactivar a una persona en cualquier momento; su historial se conserva.",
        "Avísanos de inmediato si sospechas que alguien accedió a tu cuenta sin permiso.",
      ] },
      { id: "uso", title: "4. Uso aceptable", body: [
        "No puedes usar BidPower para:",
        "- Actividades ilegales, fraudulentas o engañosas, incluido enviar propuestas, facturas o cotizaciones con información falsa.",
        "- Acceder a datos de otras empresas, probar o burlar las medidas de seguridad, o sobrecargar el servicio.",
        "- Subir virus, contenido malicioso o archivos que no tengas derecho a compartir.",
        "- Revender el servicio o copiarlo sin autorización.",
      ] },
      { id: "contenido", title: "5. Tu contenido y tus datos", body: [
        "Los proyectos, clientes, precios, documentos, fotos y demás información que cargas son tuyos. Nos das el permiso limitado que hace falta para almacenarlos, mostrarlos a las personas que tú autorices y operar el servicio.",
        "Eres responsable de tener derecho a cargar los datos de tus clientes, empleados y proveedores, y de cumplir las leyes que te apliquen al tratarlos.",
        "Los archivos permitidos son PDF, JPG, PNG y WebP de hasta 10 MB cada uno.",
        "Conserva copias de tus documentos importantes. Puedes exportar tus datos operativos en CSV o JSON desde Contabilidad.",
      ] },
      { id: "enlaces", title: "6. Documentos compartidos con clientes y suppliers", body: [
        "Las propuestas, órdenes de compra y solicitudes de precios se comparten mediante enlaces seguros. Quien tenga el enlace puede ver ese documento, así que envíalo solo a la persona correcta y trátalo como privado. El cliente no ve costos de supplier, márgenes ni información interna; el supply no ve lo que cobras a tu cliente.",
        "Cuando un cliente aprueba una propuesta, BidPower registra el nombre que escribió, la fecha, la hora y la dirección IP. Ese registro no es una firma electrónica certificada. Si necesitas una firma con validez especial, usa un contrato firmado por separado.",
        "Los precios, disponibilidad y tiempos de entrega que responde un supply son su responsabilidad. BidPower solo los muestra.",
      ] },
      { id: "facturas", title: "7. Facturas, pagos e impuestos", body: [
        "BidPower te ayuda a preparar facturas y a registrar los pagos que recibes. No cobra a tus clientes ni procesa pagos: el dinero se mueve fuera de BidPower y tú lo registras.",
        "Tú eres responsable de que las facturas, los impuestos, los números de documento y los plazos cumplan la normativa de tu país o estado.",
      ] },
      { id: "planes", title: "8. Planes y límites", body: [
        "El plan Free incluye hasta 3 proyectos activos, 3 empleados, 3 propuestas al mes, 50 gastos al mes y 20 órdenes de compra al mes. Los planes de pago quitarán esos límites.",
        "Antes de cobrarte algo te mostraremos el precio y las condiciones y esperaremos tu confirmación. Si cambiamos los límites o precios de un plan, te avisaremos con anticipación razonable.",
      ] },
      { id: "disponibilidad", title: "9. Disponibilidad y cambios al servicio", body: [
        "Trabajamos para que BidPower esté disponible y funcione bien, pero se ofrece “tal cual”: puede haber interrupciones por mantenimiento, fallos de proveedores o causas ajenas a nosotros. Sin conexión solo se muestra una página de aviso; la información se guarda cuando hay internet.",
        "Podemos mejorar, cambiar o retirar funciones. Si un cambio afecta de forma importante tu uso, te avisaremos.",
      ] },
      { id: "propiedad", title: "10. Propiedad intelectual", body: [
        "BidPower, su diseño, marca y software pertenecen a su titular. Estos términos no te transfieren ningún derecho sobre ellos, salvo el derecho limitado a usar el servicio mientras cumplas los términos.",
        "Si nos envías ideas o comentarios, podemos usarlos para mejorar el servicio sin deberte compensación.",
      ] },
      { id: "terminacion", title: "11. Suspensión y cierre de cuenta", body: [
        "Puedes dejar de usar BidPower cuando quieras. Para cerrar tu cuenta y pedir que borremos tus datos, escríbenos por los medios de contacto de esta página.",
        "Podemos suspender o cerrar una cuenta que incumpla estos términos, ponga en riesgo la seguridad del servicio o sea usada para fraude, avisando cuando sea posible.",
      ] },
      { id: "responsabilidad", title: "12. Garantías y límite de responsabilidad", body: [
        "En la medida que la ley lo permita, BidPower no es responsable por pérdidas indirectas, lucro cesante, pérdida de negocios o decisiones tomadas con la información de la app (por ejemplo, presupuestos, ganancias estimadas o precios de terceros). Los cálculos que muestra la app son una ayuda operativa que debes verificar.",
        "La responsabilidad total de BidPower frente a ti por cualquier reclamo se limita al monto que hayas pagado por el servicio en los 12 meses anteriores o, si usas el plan gratuito, a un monto simbólico. Ninguna parte de estos términos excluye responsabilidades que la ley no permita excluir.",
      ] },
      { id: "cambios", title: "13. Cambios a estos términos", body: [
        "Podemos actualizar estos términos. Publicaremos la versión nueva con su fecha y, si el cambio es importante, te lo avisaremos en la app. Seguir usando BidPower después del cambio significa que lo aceptas.",
      ] },
      { id: "ley", title: "14. Ley aplicable", body: [
        "Estos términos se rigen por las leyes aplicables en la jurisdicción del responsable del servicio indicado al final de esta página, sin perjuicio de los derechos que la ley de tu país te reconozca como usuario.",
      ] },
    ],
  },
  privacy: {
    title: "Política de privacidad",
    summaryTitle: "En palabras simples",
    summary: [
      "Guardamos solo lo que necesitas para usar BidPower: tu cuenta, los datos de tu empresa y lo que tú cargas (proyectos, clientes, documentos).",
      "No vendemos tus datos, no mostramos publicidad y no usamos rastreadores de terceros.",
      "Cada empresa ve solo sus propios datos, y dentro de la empresa cada persona ve según sus permisos.",
    ],
    sections: [
      { id: "quien", title: "1. Quién es responsable", body: [
        "El responsable del tratamiento de los datos es el titular del servicio BidPower indicado al final de esta página. Para los datos de tus clientes y proveedores que tú cargas, tú eres quien decide para qué se usan y BidPower actúa como proveedor que los almacena por encargo tuyo.",
      ] },
      { id: "datos", title: "2. Qué datos tratamos", body: [
        "- Cuenta: nombre, correo, teléfono (opcional) y contraseña. La contraseña se guarda cifrada por el sistema de autenticación; nunca podemos verla.",
        "- Empresa: nombre, logo, dirección, moneda, zona horaria y datos para tus documentos.",
        "- Operación que tú cargas: proyectos, clientes y sus datos de contacto, listas de materiales, cotizaciones, órdenes de compra, propuestas, facturas, gastos, recibos, fotos y archivos PDF.",
        "- Equipo: personas invitadas, su rol, permisos y actividad dentro de los proyectos (por ejemplo, quién subió un recibo).",
        "- Mensajes que nos envías desde Ayuda y comentarios, con la página desde la que escribiste.",
        "- Cuando un cliente responde una propuesta por enlace: el nombre que escribe, la fecha, la hora y su dirección IP.",
        "- Datos técnicos mínimos: registros del servidor y de errores para mantener la seguridad y corregir fallos.",
        "No pedimos datos de tarjetas ni de cuentas bancarias.",
      ] },
      { id: "uso", title: "3. Para qué los usamos", body: [
        "- Darte el servicio: iniciar sesión, guardar y mostrar tu información, generar tus documentos y enlaces.",
        "- Mantener la seguridad, prevenir abusos y corregir errores.",
        "- Responder tus consultas y mejorar el producto con tus comentarios.",
        "- Cumplir obligaciones legales cuando corresponda.",
        "No vendemos datos personales ni los usamos para publicidad.",
      ] },
      { id: "compartir", title: "4. Con quién se comparten", body: [
        "- Dentro de tu empresa: según el rol y los permisos que tú asignas.",
        "- Con tus clientes y suppliers: solo el documento que decides enviar mediante un enlace seguro. Un supply conectado ve únicamente las solicitudes que le envías; un cliente ve solo lo que le compartes.",
        "- Proveedores técnicos que operan el servicio: Supabase (base de datos, autenticación y almacenamiento de archivos) y Vercel (alojamiento de la aplicación). Solo tratan los datos para prestar ese servicio.",
        "- Autoridades, cuando una ley o una orden válida lo exija.",
      ] },
      { id: "cookies", title: "5. Cookies y almacenamiento local", body: [
        "Usamos únicamente lo necesario para que la app funcione:",
        "- Cookies de sesión de inicio de sesión.",
        "- Tu idioma y tema (cookie y almacenamiento del navegador).",
        "- Un service worker que guarda solo una página de aviso para cuando no hay conexión.",
        "No usamos cookies de publicidad ni herramientas de análisis de terceros.",
      ] },
      { id: "seguridad", title: "6. Seguridad", body: [
        "Los datos viajan cifrados (HTTPS). La base de datos aplica aislamiento por empresa y reglas de acceso por fila, de modo que una empresa no puede leer los datos de otra. Los enlaces seguros usan códigos largos y aleatorios que se guardan como huella, no en texto legible.",
        "Ningún sistema es 100 % invulnerable. Si detectamos un incidente que afecte tus datos, te lo comunicaremos conforme a la ley aplicable.",
      ] },
      { id: "conservacion", title: "7. Cuánto tiempo guardamos los datos", body: [
        "Mientras tu cuenta esté activa. Cuando una persona deja tu empresa se desactiva su acceso y se conserva su historial en tus proyectos. Si cierras tu cuenta, borramos o anonimizamos tus datos en un plazo razonable, salvo lo que la ley nos obligue a conservar.",
      ] },
      { id: "derechos", title: "8. Tus derechos", body: [
        "Puedes pedir acceso a tus datos, corregirlos, exportarlos, limitar su uso u oponerte, y pedir que los borremos. Parte de esto lo haces tú mismo en la app (por ejemplo, editar tu perfil y los datos de tu empresa). Para lo demás escríbenos por los medios de contacto de esta página y responderemos en un plazo razonable.",
        "Si crees que tratamos mal tus datos, también puedes acudir a la autoridad de protección de datos de tu país.",
      ] },
      { id: "transferencias", title: "9. Transferencias internacionales", body: [
        "Nuestros proveedores técnicos pueden procesar datos en servidores ubicados fuera de tu país. Cuando ocurre, exigimos medidas de protección adecuadas.",
      ] },
      { id: "menores", title: "10. Menores de edad", body: [
        "BidPower es para uso profesional y no está dirigido a menores de 18 años.",
      ] },
      { id: "cambios", title: "11. Cambios a esta política", body: [
        "Si cambiamos esta política publicaremos la nueva versión con su fecha y, si el cambio es importante, te avisaremos en la app.",
      ] },
    ],
  },
  help: helpEs,
};
export default es;
