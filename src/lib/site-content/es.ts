import type { SiteContent } from "./types";

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
    acceptNote: "Al crear tu cuenta aceptas los", footerRights: "Todos los derechos reservados.", print: "Imprimir", topics: "Temas", related: "Relacionado",
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
        "Cuando un cliente aprueba una propuesta, BidPower registra el nombre que escribió y la fecha y hora. Ese registro no es una firma electrónica certificada. Si necesitas una firma con validez especial, usa un contrato firmado por separado.",
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
  help: [
    { id: "empezar", title: "Primeros pasos", blurb: "Cuenta, empresa y proyecto.", articles: [
      { id: "crear-cuenta", q: "¿Cómo creo mi cuenta?", keywords: "registro registrar sign up", a: [
        "Entra a Crear cuenta, escribe tu nombre, correo y contraseña, y luego el nombre de tu empresa. Si eres un supply (casa de suministros), elige esa opción para recibir solicitudes de precios de contratistas.",
        "Si te invitaron a un equipo, abre el enlace de invitación: tu correo ya viene puesto y quedas dentro de esa empresa.",
      ] },
      { id: "empresa", q: "¿Dónde pongo el logo y los datos de mi empresa?", keywords: "configuración logo moneda zona horaria", a: [
        "En Más → Configuración (solo el propietario). Ahí están el nombre, logo, dirección, moneda y zona horaria. Esos datos salen en tus propuestas, órdenes de compra y facturas.",
        "El logo puede ser JPG, PNG o WebP.",
      ] },
      { id: "proyecto", q: "¿Cómo creo un proyecto?", keywords: "nuevo proyecto cliente", a: [
        "Primero agrega el cliente en Clientes, luego crea el proyecto desde Proyectos → Nuevo. Dentro del proyecto tienes materiales, compras, propuestas, facturas, gastos y actividad; no tienes que volver a escribir el nombre del proyecto.",
      ] },
      { id: "olvide", q: "Olvidé mi contraseña", keywords: "recuperar contraseña clave", a: [
        "En la pantalla de inicio de sesión toca “¿Olvidaste tu contraseña?”. Te llega un enlace seguro al correo para crear una nueva. Revisa también la carpeta de spam.",
      ] },
      { id: "idioma", q: "¿Cómo cambio el idioma?", keywords: "español english português idioma", a: [
        "Con el selector de idioma (arriba a la derecha en las pantallas de acceso, y en Configuración dentro de la app). BidPower está disponible en español, inglés y portugués.",
      ] },
    ] },
    { id: "materiales", title: "Materiales y compras", blurb: "Lista de materiales, comprar ya y órdenes de compra.", articles: [
      { id: "lista", q: "¿Cómo armo una lista de materiales?", keywords: "material lista carrito importar excel csv", a: [
        "En el proyecto abre Material. Busca en tu biblioteca, escribe el artículo (por ejemplo “10 breakers 20A”: la cantidad se detecta sola) o importa una lista desde Excel/CSV. Cada vez que agregas algo, la biblioteca aprende para sugerírtelo después.",
      ] },
      { id: "comprar-ya", q: "¿Qué es “Comprar ya”?", keywords: "orden de compra PO comprar", a: [
        "Úsalo cuando ya sabes dónde comprar. Se crea la orden de compra con tu lista, la envías al supplier y después subes el recibo. El costo se suma al proyecto cuando completas la compra.",
      ] },
      { id: "pedir-precios", q: "¿Qué es “Pedir cotización a suppliers”?", keywords: "cotización pricing request supply", a: [
        "Úsalo cuando necesitas comparar precios. Se crea una solicitud de precios con tu lista y la envías a uno o varios suppliers. Cuando el supply responde, la respuesta aparece en la solicitud y desde ahí conviertes la elegida en orden de compra.",
        "La solicitud de precios es para el supply. La propuesta es para tu cliente: son cosas distintas y nunca se mezclan.",
      ] },
      { id: "po-limite", q: "¿Por qué no puedo crear o enviar una orden de compra?", keywords: "permiso límite aprobación empleado", a: [
        "Tu propietario decide si puedes comprar y hasta qué monto. Si una compra supera tu límite, queda esperando aprobación. Pídele que ajuste tu permiso en Equipo.",
      ] },
      { id: "recibo", q: "¿Cómo subo un recibo?", keywords: "recibo foto comprobante", a: [
        "En la orden de compra toca la cámara y toma la foto del recibo. Los empleados deben entregar el recibo con foto antes de poder hacer otra compra. Se aceptan JPG, PNG y WebP (también fotos del iPhone) de hasta 10 MB.",
      ] },
    ] },
    { id: "propuestas", title: "Propuestas y clientes", blurb: "Enviar, aprobar y cambiar propuestas.", articles: [
      { id: "crear-propuesta", q: "¿Cómo creo una propuesta para mi cliente?", keywords: "proposal presupuesto quote", a: [
        "En el proyecto, Propuesta → Nueva. Agrega las líneas (puedes elegirlas de tu biblioteca), impuestos o descuento, términos y notas. Cuando esté lista, envíala y comparte el enlace seguro con tu cliente.",
      ] },
      { id: "cliente-aprueba", q: "¿Cómo aprueba mi cliente?", keywords: "aprobar cambios enlace", a: [
        "Abre el enlace sin necesidad de cuenta, revisa la propuesta y la aprueba escribiendo su nombre, o pide cambios con un comentario. Tú ves la respuesta en la propuesta y en lo que necesita tu atención.",
        "La aprobación registra nombre, fecha y hora; no es una firma electrónica certificada.",
      ] },
      { id: "cliente-ve", q: "¿Qué ve mi cliente?", keywords: "privacidad costos margen", a: [
        "Solo la propuesta y lo que compartes. Nunca ve precios de supplier, costos de órdenes de compra, margen ni ganancia.",
      ] },
      { id: "versiones", q: "El cliente pidió cambios, ¿qué hago?", keywords: "versión revisar editar", a: [
        "Crea una nueva versión de la propuesta con los cambios y vuelve a enviarla. La anterior queda en el historial.",
      ] },
    ] },
    { id: "facturas", title: "Facturas y dinero", blurb: "Facturar, registrar pagos y controlar costos.", articles: [
      { id: "facturar", q: "¿Cómo emito una factura?", keywords: "invoice factura anticipo", a: [
        "Desde una propuesta aprobada elige Facturar. Puedes facturar el total o una parte (por ejemplo un anticipo). La factura tiene PDF para enviar y su propio número.",
      ] },
      { id: "pagos", q: "¿BidPower cobra a mi cliente?", keywords: "pago cobrar stripe tarjeta", a: [
        "No. BidPower no procesa pagos. Cuando tu cliente te paga, registras el pago en la factura y el saldo y el estado se actualizan solos (parcial, pagada o vencida).",
      ] },
      { id: "costos", q: "¿Dónde veo cuánto gano en el proyecto?", keywords: "ganancia presupuesto costo reportes", a: [
        "En el proyecto verás presupuesto, costo real, costo comprometido y ganancia estimada. Solo lo ven los roles con permiso para ver costos o ganancias.",
        "Son cifras operativas para decidir, no contabilidad. Compruébalas con tu contador.",
      ] },
      { id: "exportar", q: "¿Puedo exportar para mi contador?", keywords: "contabilidad quickbooks exportar csv", a: [
        "Sí. En Más → Contabilidad exportas tus datos (gastos, facturas y más) en CSV o JSON para tu contador o para QuickBooks.",
      ] },
    ] },
    { id: "equipo", title: "Equipo y permisos", blurb: "Invitar personas y decidir qué pueden hacer.", articles: [
      { id: "invitar", q: "¿Cómo invito a un empleado?", keywords: "invitación equipo empleado manager", a: [
        "En Equipo toca Invitar, escribe su nombre y correo, elige una plantilla de permisos y los proyectos donde trabajará. Comparte el enlace de invitación; al abrirlo crea su cuenta y queda dentro.",
        "El plan Free permite hasta 3 empleados.",
      ] },
      { id: "permisos", q: "¿Qué puede hacer cada rol?", keywords: "owner manager employee permisos plantilla", a: [
        "- Propietario: todo, incluido el equipo y la configuración.",
        "- Manager: gestiona proyectos, compras y clientes.",
        "- Empleado: ve solo los proyectos asignados, pide materiales y sube recibos. Puede comprar solo si el propietario se lo permite, con un límite de monto.",
        "Los permisos se pueden cambiar o quitar en cualquier momento.",
      ] },
      { id: "desactivar", q: "Una persona dejó la empresa, ¿qué hago?", keywords: "desactivar baja", a: [
        "Desactívala en Equipo. Pierde el acceso de inmediato y su historial se conserva en tus proyectos.",
      ] },
    ] },
    { id: "supply", title: "Suppliers", blurb: "Responder solicitudes y conectar con contratistas.", articles: [
      { id: "supply-responder", q: "Soy supplier: ¿cómo respondo una solicitud de precios?", keywords: "responder cotización quote pdf", a: [
        "Abre el enlace que te enviaron (no necesitas cuenta) o entra a tu bandeja si tienes cuenta supply. Revisa la lista, planos y notas, haz preguntas si algo no está claro, y sube tu cotización en PDF con número, total, disponibilidad y tiempo de entrega.",
        "No ves lo que el contratista cobra a su cliente.",
      ] },
      { id: "supply-conectar", q: "¿Cómo me conecto con un contratista?", keywords: "código conexión connect", a: [
        "El supply genera un código de un solo uso (vence en 14 días) y se lo da al contratista. Él lo escribe en Suppliers y queda conectado. También puedes compartir el enlace de registro para que el contratista cree su cuenta.",
      ] },
    ] },
    { id: "app", title: "App e instalación", blurb: "Instalar en iPhone, Android y computadora.", articles: [
      { id: "instalar-iphone", q: "¿Cómo la instalo en el iPhone o iPad?", keywords: "pwa instalar pantalla de inicio safari", a: [
        "Abre BidPower en Safari, toca Compartir y luego “Agregar a pantalla de inicio”. Se abre como una app, a pantalla completa.",
      ] },
      { id: "instalar-android", q: "¿Y en Android o en la computadora?", keywords: "chrome instalar android windows", a: [
        "En Chrome o Edge toca “Instalar” cuando la app te lo ofrece (en Más → Instalar) o usa el menú del navegador → Instalar aplicación.",
      ] },
      { id: "sin-internet", q: "¿Funciona sin internet?", keywords: "offline conexión", a: [
        "Necesita conexión para guardar y ver tus datos. Sin internet verás una página de aviso; al volver la conexión continúas donde estabas.",
      ] },
      { id: "falla", q: "Algo no funciona", keywords: "error bug problema lento", a: [
        "Prueba cerrar y volver a abrir la app o recargar la página. Si el problema sigue, cuéntanos en Más → Ayuda y comentarios qué estabas haciendo y qué viste; se guarda la página donde estabas.",
      ] },
    ] },
  ],
};
export default es;
