import type { HelpTopic } from "./types";

// Every screen and function of the app, in the words the app itself uses. Steps are "1. " lines.
export const helpEs: HelpTopic[] = [
  { id: "empezar", title: "Primeros pasos", blurb: "Cuenta, empresa y cómo se conecta todo.", articles: [
    { id: "como-funciona", q: "¿Cómo funciona BidPower de principio a fin?", keywords: "flujo resumen proceso ciclo", a: [
      "Todo gira alrededor del proyecto. El camino típico es este:",
      "1. Cliente → Proyecto.",
      "2. Lista de material del proyecto (la arma tu equipo o tú).",
      "3. De la lista: “Comprar ya” (orden de compra) o “Pedir cotización a suppliers” (comparas precios y adjudicas).",
      "4. Orden de compra → el supplier entrega → subes el recibo → el costo real entra al proyecto.",
      "5. Propuesta para tu cliente → él aprueba por enlace → factura → registras los pagos.",
      "La propuesta (lo que cobras al cliente) y la cotización (lo que pides al supplier) son cosas distintas y nunca se mezclan: el cliente jamás ve costos ni márgenes y el supplier jamás ve lo que cobras.",
    ] },
    { id: "crear-cuenta", q: "¿Cómo creo mi cuenta?", keywords: "registro registrar sign up", a: [
      "Entra a Crear cuenta, escribe tu nombre, correo y contraseña y luego el nombre de tu empresa. Si eres una casa de suministros (supply), elige esa opción para recibir pedidos de cotización de contratistas.",
      "Si te invitaron a un equipo, abre el enlace de invitación: tu correo ya viene puesto y quedas dentro de esa empresa.",
    ] },
    { id: "olvide", q: "Olvidé mi contraseña", keywords: "recuperar contraseña clave", a: [
      "En el inicio de sesión toca “¿Olvidaste tu contraseña?”. Te llega un enlace seguro al correo para crear una nueva. Revisa también el spam.",
    ] },
    { id: "idioma-tema", q: "¿Cómo cambio el idioma o el tema oscuro?", keywords: "español english português idioma tema oscuro claro", a: [
      "El idioma se cambia con el botón pequeño de idioma (ES / EN / PT) arriba, o en Más → Configuración → Idioma. El tema (claro, oscuro o automático según tu dispositivo) está en Configuración → Tema.",
    ] },
    { id: "roles-resumen", q: "¿Qué ve cada persona?", keywords: "owner manager employee supply cliente privacidad", a: [
      "- Propietario (Owner): todo, incluidos equipo, configuración y ganancias.",
      "- Manager: gestiona proyectos, compras y clientes; las ganancias solo si el Owner se lo permite.",
      "- Empleado: solo sus proyectos asignados; pide material, sube recibos y compra si tiene permiso.",
      "- Supplier: solo los pedidos de cotización que le envías.",
      "- Cliente: solo la propuesta o el documento que le compartes por enlace.",
    ] },
  ] },
  { id: "inicio", title: "Inicio, búsqueda y calendario", blurb: "Lo que necesita tu atención y cómo encontrar cualquier cosa.", articles: [
    { id: "inicio-owner", q: "¿Qué muestra la pantalla de Inicio?", keywords: "dashboard atención esperando", a: [
      "- Requiere atención: lo que debes resolver hoy (material pedido, supplier que respondió, cotización que vence, PO sin recibo, cliente que pidió cambios, factura vencida, propuesta lista para facturar). Si no hay nada dice “Todo al día”.",
      "- Esperando a: quién tiene la próxima acción en cada cosa (supplier, cliente, empleado o tú).",
      "- Compras del equipo: quién compró dónde y qué recibos faltan.",
      "- Accesos rápidos: Nuevo proyecto, Material, Nueva propuesta, Nuevo gasto.",
      "- Tus proyectos activos.",
    ] },
    { id: "inicio-empleado", q: "¿Y la pantalla de Inicio de un empleado?", keywords: "empleado recibos pedir comprar", a: [
      "Muestra los recibos por subir (si tienes alguno pendiente no puedes hacer otra compra), el botón para pedir material, el límite con el que puedes comprar sin aprobación y “Mis pedidos y compras”.",
    ] },
    { id: "buscar", q: "¿Cómo busco algo?", keywords: "búsqueda buscar encontrar", a: [
      "Usa la lupa o la barra de Inicio. Escribe al menos 2 letras y busca a la vez proyectos, clientes, propuestas y facturas (por número), órdenes de compra, listas de material, pedidos de cotización, materiales y suppliers. Cada empleado solo encuentra lo que puede ver.",
    ] },
    { id: "calendario", q: "¿Qué hay en el Calendario?", keywords: "fechas entregas vencimientos", a: [
      "Muestra por mes las entregas esperadas de órdenes de compra, los vencimientos de facturas por cobrar, las fechas límite de respuesta de las cotizaciones, las propuestas que vencen y el fin estimado de proyectos; abajo, los proyectos programados según su fecha de inicio. Las fechas usan la zona horaria de tu empresa.",
    ] },
  ] },
  { id: "proyectos", title: "Proyectos", blurb: "El centro de todo: estado, dinero y equipo.", articles: [
    { id: "crear-proyecto", q: "¿Cómo creo un proyecto?", keywords: "nuevo proyecto cliente estado", a: [
      "1. Proyectos → Nuevo proyecto (o el botón + de Inicio).",
      "2. Escribe el nombre, elige el cliente (o crea uno nuevo ahí mismo con “+ Nuevo cliente”) y la dirección.",
      "3. En “Más detalles” puedes poner fecha de inicio, valor del contrato, presupuesto (materiales, mano de obra, subcontratistas, otros) y notas.",
      "Si el proyecto tiene fecha de inicio, aparece en el Calendario.",
    ] },
    { id: "estados", q: "¿Qué significa cada estado del proyecto?", keywords: "lead cotizado aprobado activo pausa completado cancelado", a: [
      "Lead (oportunidad), Cotizado (ya enviaste propuesta), Aprobado, Activo (en ejecución), En pausa, Completado y Cancelado. Puedes filtrar la lista por estado y cambiarlo al editar el proyecto.",
    ] },
    { id: "control-proyecto", q: "¿Qué es el Control del proyecto?", keywords: "presupuesto costo real comprometido ganancia", a: [
      "Es el resumen de dinero dentro de cada proyecto (solo para quien tiene permiso de ver costos o ganancias):",
      "- Contrato y presupuesto.",
      "- Costo real: lo ya pagado (gastos y órdenes de compra completadas).",
      "- Comprometido: órdenes de compra abiertas que todavía no se pagan. Pasa a costo real cuando completas el PO.",
      "- Costo proyectado y presupuesto restante.",
      "- Ganancia estimada. Avisa si estás cerca o por encima del presupuesto.",
      "- Facturado, cobrado y por cobrar.",
      "Son números operativos para decidir, no contabilidad.",
    ] },
    { id: "equipo-proyecto", q: "¿Cómo asigno personas a un proyecto?", keywords: "asignar equipo empleados", a: [
      "Dentro del proyecto, en “Equipo del proyecto”, toca Asignar junto a la persona (primero debes invitarla desde Equipo). Los empleados solo ven los proyectos donde están asignados. Para quitarla toca Quitar.",
    ] },
    { id: "actividad", q: "¿Qué es la Actividad del proyecto?", keywords: "historial timeline", a: [
      "Una línea de tiempo con todo lo que pasó: listas de material, pedidos de cotización, respuestas de suppliers, órdenes de compra, propuestas, respuestas del cliente, change orders y gastos.",
    ] },
    { id: "accesos-proyecto", q: "¿Qué accesos tiene un proyecto?", keywords: "herramientas takeoffs listas gastos", a: [
      "Desde el proyecto abres: Listas de material, Órdenes de compra, Propuestas, Facturas, Gastos, Takeoffs y Calendario, ya filtrados por ese proyecto. No tienes que volver a elegir el proyecto.",
    ] },
    { id: "editar-archivar-proyecto", q: "¿Cómo edito o archivo un proyecto?", keywords: "editar archivar eliminar", a: [
      "En el proyecto toca Editar proyecto para cambiar datos y estado. Archivar proyecto lo quita de las listas activas sin borrar su historial. Los proyectos activos cuentan para el límite de tu plan.",
    ] },
  ] },
  { id: "clientes", title: "Clientes", blurb: "Tus clientes y lo que te deben.", articles: [
    { id: "crear-cliente", q: "¿Cómo agrego un cliente?", keywords: "nuevo cliente contacto", a: [
      "Clientes → Nuevo cliente. Pide nombre de la empresa o persona, contacto, email, teléfono, dirección y notas; solo el nombre es obligatorio.",
    ] },
    { id: "ficha-cliente", q: "¿Qué veo en la ficha de un cliente?", keywords: "cliente detalle debe", a: [
      "Sus datos, sus proyectos, propuestas y facturas, y cuánto te debe. Desde ahí creas un proyecto o una propuesta con el cliente ya elegido.",
    ] },
    { id: "archivar-cliente", q: "¿Cómo edito o archivo un cliente?", keywords: "editar archivar", a: [
      "En la ficha toca Editar. Archivar cliente lo marca como inactivo; sus proyectos y documentos se conservan. Los empleados solo ven los clientes de los proyectos donde están asignados.",
    ] },
  ] },
  { id: "materiales", title: "Materiales", blurb: "Biblioteca, listas de material y pedidos del equipo.", articles: [
    { id: "biblioteca", q: "¿Para qué sirve la biblioteca de materiales?", keywords: "biblioteca ítems apodos favoritos", a: [
      "Es tu catálogo propio de artículos que pides seguido. Cada ítem tiene descripción, número de parte, fabricante, unidad, categoría, notas y apodos de campo (por ejemplo “romex” o “mud ring”) para encontrarlo como lo dices en la obra. Puedes marcar favoritos. Se aprende sola: lo que agregas a una lista como texto libre puede guardarse en la biblioteca.",
      "Para agregar uno: Más → Material → Biblioteca → Agregar ítem. Archivar un ítem no cambia los pedidos anteriores.",
    ] },
    { id: "historial-precios", q: "¿Veo el historial de precios de un material?", keywords: "precio histórico más bajo", a: [
      "Sí. Al abrir un ítem ves lo que pagaste (órdenes de compra) y lo que te cotizaron, con el precio más bajo reciente y el proveedor. Solo lo ven quienes tienen permiso de ver costos.",
    ] },
    { id: "importar", q: "¿Cómo importo mi lista desde Excel?", keywords: "importar excel csv plantilla xlsx", a: [
      "1. En la biblioteca toca “Importar lista (Excel o CSV)”.",
      "2. Descarga la plantilla (columnas: descripción, número de parte, fabricante, unidad, categoría y apodos) o usa tu archivo, o pega las filas desde Excel.",
      "3. Revisa la vista previa (“N materiales listos para importar”) y toca Importar.",
      "Máximo 2000 filas por importación. Los que ya existen se omiten por número de parte y las filas sin descripción se ignoran. Los .xls antiguos no se leen: en Excel usa Guardar como .xlsx o CSV.",
    ] },
    { id: "armar-lista", q: "¿Cómo armo una lista de material para un proyecto?", keywords: "lista material pedido carrito", a: [
      "1. Material → elige el proyecto (o entra desde el proyecto → Nueva lista de material).",
      "2. Busca un ítem (por ejemplo “thhn 8 rojo x 500”: la cantidad se detecta sola) y toca Agregar a la lista. También hay Favoritos, Recientes y Listas guardadas.",
      "3. Si no existe, agrégalo como texto libre; marca “Guardar ítems nuevos en la biblioteca” si quieres reutilizarlo.",
      "4. También puedes Pegar lista: pega desde WhatsApp, correo o Excel, un ítem por línea (por ejemplo “20 x EMT 3/4”).",
      "5. Marca “Permitir sustitución” si aceptas equivalentes, agrega notas y toca Enviar pedido.",
      "Puedes guardar la lista con un nombre para reutilizarla en otro proyecto.",
    ] },
    { id: "siguiente-paso", q: "Ya tengo la lista, ¿qué sigue?", keywords: "comprar ya cotización siguiente paso", a: [
      "Al revisar una lista, BidPower te pregunta qué quieres hacer:",
      "- Comprar ya: ya sabes dónde comprar. Eliges el supplier (o escribes otro), el monto estimado y se crea la orden de compra con las líneas de la lista.",
      "- Pedir cotización a suppliers: compara precios de varios y compra al mejor.",
      "El proyecto y los materiales no se vuelven a escribir.",
    ] },
    { id: "revisar-pedido", q: "Mi empleado pidió material, ¿cómo lo reviso?", keywords: "revisar devolver pedido empleado", a: [
      "Aparece en Requiere atención y en Material → Listas de material. Ábrelo y elige Marcar como revisado (con una nota opcional) o Devolver. Después decides si compras o pides cotización. Un empleado puede cancelar su pedido mientras esté sin revisar.",
    ] },
  ] },
  { id: "cotizaciones", title: "Cotizaciones a suppliers", blurb: "Pedir precios, comparar y adjudicar.", articles: [
    { id: "pedir-cotizacion", q: "¿Cómo pido una cotización a mis suppliers?", keywords: "pricing request pedir cotización bid date", a: [
      "Una cotización siempre parte de una lista de material (si no tienes una, BidPower te lleva a crearla).",
      "1. Pedidos de cotización → Pedir cotización, o “Pedir cotización a suppliers” desde la lista.",
      "2. Elige la lista. Los materiales y el proyecto salen de ahí.",
      "3. Indica “Responder antes de” (Bid Date), si es entrega en obra o recoger, y las especificaciones.",
      "4. En “Más opciones” puedes poner título, tipo (Gear, Lighting, Material u Other) y enlaces de planos o specs. Puedes subir archivos (planos, PDFs).",
    ] },
    { id: "pasos-cotizacion", q: "¿Cuáles son los pasos de una cotización?", keywords: "pasos estado flujo", a: [
      "Cuatro pasos que ves arriba del pedido: 1 · Lo que pides, 2 · A quién se lo pides, 3 · Respuestas y 4 · Decidir.",
    ] },
    { id: "enviar-supplier", q: "¿Cómo se lo envío al supplier?", keywords: "enlace seguro cuenta supply enviar correo", a: [
      "En el paso 2 eliges el supplier y el contacto:",
      "- Si el supplier tiene cuenta Supply conectada (insignia “Cuenta Supply”), toca “Enviar a su cuenta Supply”: lo verá en su bandeja.",
      "- Si no, “Crear enlace seguro”: define los días de validez, copia el enlace y envíalo por WhatsApp o correo. El enlace se muestra una sola vez; si lo pierdes, revócalo y crea otro.",
      "BidPower todavía no envía correos por ti: tú compartes el enlace o usas “Copiar texto para enviar”, y luego tocas “Marcar como enviado”. Verás si el enlace fue abierto, cuándo vence y puedes Revocarlo.",
    ] },
    { id: "registrar-respuesta", q: "El supplier respondió, ¿cómo registro su precio?", keywords: "respuesta quote total pdf registrar", a: [
      "Si respondió por el enlace o su cuenta, su respuesta aparece sola. Si te la mandó por otro medio toca Registrar respuesta: escribe supplier, número de cotización, total, disponibilidad, tiempo de entrega, flete e impuesto, y adjunta el PDF. Si solo tienes el total, escribe solo el total; el detalle por línea es opcional.",
      "Los precios solo los ven quienes tienen permiso de ver costos.",
    ] },
    { id: "preguntas-supplier", q: "El supplier me hizo una pregunta", keywords: "preguntas responder", a: [
      "Aparece en “Preguntas del supplier” dentro del pedido y en Requiere atención. Toca Responder y el supplier recibe tu respuesta en su enlace o su bandeja.",
    ] },
    { id: "adjudicar", q: "¿Cómo comparo y elijo al ganador?", keywords: "adjudicar mejor precio comparar", a: [
      "En el paso 3 ves todas las respuestas, con la etiqueta “Mejor precio”. Toca Adjudicar en la elegida: las demás quedan declinadas. Después toca “Crear orden de compra” y se genera con esa respuesta. Si la orden ya existe aparece “Ver PO-…”.",
    ] },
    { id: "cerrar-cancelar", q: "¿Puedo cerrar o cancelar un pedido de cotización?", keywords: "cerrar cancelar", a: [
      "Sí: Cerrar da el pedido por terminado y Cancelar lo anula. Los enlaces enviados siguen el estado del pedido.",
    ] },
  ] },
  { id: "compras", title: "Órdenes de compra", blurb: "Comprar, recibir y cerrar con el recibo.", articles: [
    { id: "crear-po", q: "¿Cómo creo una orden de compra (PO)?", keywords: "po orden compra crear", a: [
      "Hay dos caminos: “Comprar ya” desde una lista de material, o “Crear orden de compra” desde la respuesta adjudicada de una cotización. También puedes entrar a Órdenes de compra → Nueva. Lleva el supplier, el proyecto, las líneas, el monto estimado y se numera sola (PO-…).",
    ] },
    { id: "estados-po", q: "¿Qué significan los estados de una orden?", keywords: "estados po enviado recibido completado", a: [
      "Por aprobar (supera el límite de quien la creó), Aprobado, Rechazado, Enviado (se lo mandaste al supplier), Recibido, Sin documento (falta el recibo), Documento recibido, En revisión, Completado y Cancelado. En la lista puedes filtrar Por aprobar, En curso o Completado.",
    ] },
    { id: "limite-aprobacion", q: "Mi PO “espera aprobación”, ¿por qué?", keywords: "límite aprobar rechazar empleado permiso", a: [
      "El Owner define si puedes comprar y hasta qué monto. Si el PO supera tu límite queda en “Por aprobar” y el Owner o un Manager lo Aprueba o Rechaza (con nota opcional). El monto desconocido nunca se salta el límite.",
    ] },
    { id: "enviar-recibir", q: "¿Cómo marco que se envió y que llegó?", keywords: "enviado recibido entrega esperada parcial", a: [
      "Toca “Marcar como enviado al supplier” cuando lo mandes. Puedes poner la Entrega esperada: si se atrasa, te avisamos en Inicio. Al llegar el pedido, usa “Todo llegó” o “Guardar lo recibido” para indicar la cantidad recibida de cada línea (recibos parciales: “Recibido 3 de 5”).",
    ] },
    { id: "recibo-po", q: "¿Cómo cierro el PO con el recibo?", keywords: "recibo foto completar documento packing slip", a: [
      "1. En el PO toca la cámara (“Tomar foto del recibo”) o elige una foto/archivo. Puede ser recibo, factura o packing slip.",
      "2. Escribe el costo real y el impuesto incluido que dice el documento.",
      "3. Toca Completar PO.",
      "Sin documento no se puede completar. Al completar, el costo real se registra como gasto del proyecto y deja de estar “comprometido”. Se aceptan PDF, JPG, PNG y WebP (también fotos del iPhone) de hasta 10 MB.",
    ] },
    { id: "cancelar-po", q: "¿Puedo cancelar una orden?", keywords: "cancelar po historial", a: [
      "Sí, con Cancelar PO mientras no esté completada. El Historial de la orden guarda cada cambio de estado y quién lo hizo.",
    ] },
  ] },
  { id: "gastos", title: "Gastos y recibos", blurb: "Registrar gastos y aprobarlos.", articles: [
    { id: "nuevo-gasto", q: "¿Cómo registro un gasto?", keywords: "gasto nuevo foto recibo categoría", a: [
      "Gastos → Nuevo gasto (o el botón + de Inicio). Elige proyecto (o “Sin proyecto”), proveedor, categoría, importe, fecha, notas y la foto o archivo del recibo, factura o packing slip.",
    ] },
    { id: "aprobar-gasto", q: "El gasto de un empleado queda “por aprobar”", keywords: "aprobar rechazar gasto pendiente", a: [
      "Es normal: un gasto de empleado queda pendiente hasta que el Owner o un Manager lo apruebe, y hasta entonces no cuenta como costo del proyecto. Quien lo creó puede corregirlo o cancelarlo mientras está pendiente.",
    ] },
    { id: "categorias", q: "¿Cómo manejo las categorías de gastos?", keywords: "categorías configuración", a: [
      "Más → Configuración → Categorías de gastos (solo el Owner). Crea las tuyas y activa o desactiva las del sistema.",
    ] },
    { id: "regla-recibo", q: "¿Por qué un empleado no puede comprar otra vez?", keywords: "recibo obligatorio bloqueo", a: [
      "Cada compra de un empleado exige subir la foto del recibo. Mientras tenga recibos pendientes no puede crear otra compra. Cuando sube el recibo, vuelve a poder comprar. El Owner ve en Inicio quién tiene recibos atrasados.",
    ] },
  ] },
  { id: "propuestas", title: "Propuestas y cambios", blurb: "Lo que envías al cliente para aprobar.", articles: [
    { id: "crear-propuesta", q: "¿Cómo creo una propuesta?", keywords: "proposal propuesta nueva partidas impuesto descuento", a: [
      "1. Propuestas → Nueva propuesta (o desde el proyecto o el cliente).",
      "2. Elige cliente y proyecto, y el impuesto %.",
      "3. En Partidas agrega artículos: al escribir en descripción te sugiere de tu biblioteca; pon número de parte, unidad (pieza, pie, caja, rollo, hora, lote), cantidad y precio. Puedes agregar notas por renglón.",
      "4. Añade términos y notas, y guarda. El total se calcula solo.",
    ] },
    { id: "enviar-propuesta", q: "¿Cómo se la envío al cliente?", keywords: "enlace cliente enviar copiar", a: [
      "En la propuesta toca “Crear enlace y enviar”, escribe el nombre del cliente (y su correo, opcional), copia el enlace y envíalo por WhatsApp o correo. El cliente no necesita cuenta. El enlace se muestra una sola vez; si se pierde, revócalo y crea otro. En “Enlaces para el cliente” ves si lo abrió.",
    ] },
    { id: "cliente-responde", q: "¿Cómo aprueba o pide cambios mi cliente?", keywords: "aprobar firmar cambios", a: [
      "Abre el enlace, revisa la propuesta y la aprueba escribiendo su nombre, o pide cambios con un mensaje. Tú ves la respuesta en la propuesta y en Requiere atención. La aprobación guarda nombre, fecha, hora e IP: no es una firma manuscrita ni una firma electrónica certificada.",
      "El cliente solo ve partidas, impuestos y total: nunca costos, márgenes ni suppliers.",
    ] },
    { id: "versiones", q: "Ya la envié y quiero cambiarla", keywords: "versión nueva editar bloqueada", a: [
      "Una propuesta enviada no se edita. Toca “Nueva versión”: se crea una copia editable y la actual queda reemplazada (sus enlaces dejan de funcionar). Verás las versiones en “Versiones”.",
    ] },
    { id: "decision-manual", q: "El cliente me aprobó por teléfono o en persona", keywords: "decisión manual aprobar fuera", a: [
      "Usa “Registrar decisión manual” → “El cliente aprobó fuera de la app” (o rechazó). Se guarda como decisión manual, sin enlace del cliente.",
    ] },
    { id: "change-orders", q: "¿Qué son los Change Requests y Change Orders?", keywords: "cambios change order adicional crédito", a: [
      "Si el cliente pide cambios por el enlace, aparece en “Cambios pedidos por el cliente”. Desde ahí puedes Rechazarlo o Crear Change Order.",
      "Un Change Order lleva título, descripción y líneas; un precio negativo es un crédito. Al aprobarse, la diferencia se suma al valor del contrato del proyecto.",
    ] },
    { id: "margen", q: "¿Dónde veo el margen de una propuesta aprobada?", keywords: "margen ganancia", a: [
      "En la propuesta aprobada, la tarjeta “Margen del proyecto” compara el contrato contra el costo real más lo comprometido. Solo la ven quienes tienen permiso de ver ganancias.",
    ] },
  ] },
  { id: "facturas", title: "Facturas y cobros", blurb: "Facturar, registrar pagos y estados.", articles: [
    { id: "factura-propuesta", q: "¿Cómo emito una factura desde una propuesta?", keywords: "facturar anticipo porcentaje", a: [
      "1. En una propuesta aprobada, tarjeta Facturación → Crear factura.",
      "2. Elige cuánto cobrar: todo, un porcentaje (por ejemplo un anticipo del 30 %) o “Lo que falta”.",
      "3. Revisa vencimiento y notas, y guarda como borrador.",
      "La tarjeta muestra “Facturado X de Y”; cuando se factura todo avisa que la propuesta ya está facturada completa.",
    ] },
    { id: "factura-manual", q: "¿Puedo hacer una factura sin propuesta?", keywords: "factura manual nueva", a: [
      "Sí: Facturas → Nueva factura. Eliges cliente, vencimiento, descripción e importe. El número se propone solo y nunca se repite.",
    ] },
    { id: "estados-factura", q: "¿Qué significan los estados de la factura?", keywords: "borrador enviada parcial pagada vencida", a: [
      "Borrador, Enviada, Pago parcial, Pagada, Vencida (pasó la fecha sin pagarse completa) y Cancelada. El estado se actualiza solo según los pagos y la fecha de vencimiento.",
    ] },
    { id: "registrar-pago", q: "Mi cliente me pagó, ¿cómo lo registro?", keywords: "pago registrar cobrar", a: [
      "Abre la factura, toca Registrar pago manual, escribe el importe y confirma; o “Marcar como pagada” si pagó todo. El saldo se recalcula solo. BidPower no cobra a tu cliente ni procesa tarjetas: el dinero se mueve fuera y tú lo registras.",
    ] },
    { id: "pdf-factura", q: "¿Cómo envío la factura?", keywords: "pdf imprimir enviar", a: [
      "La factura tiene PDF con el logo y datos de tu empresa. Descárgalo y envíalo por correo o WhatsApp, y toca “Marcar como enviada”. Una factura cancelada no se puede deshacer; solo se cancela si no tiene pagos.",
    ] },
  ] },
  { id: "reportes", title: "Reportes y contabilidad", blurb: "Números del negocio y exportación.", articles: [
    { id: "reportes", q: "¿Qué muestran los Reportes?", keywords: "reportes ventas gastos ganancia conversión", a: [
      "Ventas contratadas, propuestas aprobadas, gastos, ganancia estimada, facturas pendientes y vencidas, proyectos por estado y conversión de propuestas (total, aprobadas, pendientes). Solo para Owner y Manager, y pueden exportarse.",
    ] },
    { id: "exportar", q: "¿Cómo exporto datos para mi contador o QuickBooks?", keywords: "contabilidad exportar csv json quickbooks", a: [
      "Más → Contabilidad (Owner o Manager con permiso). Elige los datos a exportar, el formato (CSV o JSON; todos juntos solo en JSON), el rango de fechas y opcionalmente un proyecto, y toca Descargar. Solo se exportan gastos aprobados y reembolsados.",
      "BidPower no es contabilidad y todavía no se sincroniza directo con QuickBooks. Abajo ves el historial de exportaciones.",
    ] },
  ] },
  { id: "equipo", title: "Equipo y permisos", blurb: "Invitar personas y decidir qué pueden hacer.", articles: [
    { id: "invitar", q: "¿Cómo invito a un empleado o manager?", keywords: "invitación equipo empleado", a: [
      "1. Equipo → Invitar empleado.",
      "2. Escribe nombre completo y correo, y elige la plantilla (Empleado básico, Empleado con compras o Manager) y los proyectos.",
      "3. Copia el enlace o compártelo por WhatsApp. Es de un solo uso, vence en 7 días y se muestra una sola vez. La persona debe registrarse con ese mismo correo.",
      "En “Invitaciones pendientes” puedes Revocar. El plan Free permite hasta 3 empleados.",
    ] },
    { id: "plantillas", q: "¿Qué incluye cada plantilla?", keywords: "plantilla básico compras manager", a: [
      "- Empleado básico: pide material y sube recibos y documentos. No compra.",
      "- Empleado con compras: lo anterior, más crear órdenes de compra hasta $500 sin aprobación (puedes cambiar el límite).",
      "- Manager: gestiona proyectos, compras, cotizaciones, propuestas y biblioteca; ve costos pero no ganancias, salvo que se lo permitas.",
    ] },
    { id: "permisos", q: "¿Qué permisos individuales existen?", keywords: "permisos pedir material subir documentos biblioteca po enviar costos ganancias", a: [
      "En la ficha de cada persona (Equipo → persona → Permisos) activas o desactivas: pedir material, subir documentos, gestionar la biblioteca, crear pedidos de cotización, crear PO, enviar PO, ver costos, ver ganancias y crear propuestas, más el Límite de PO (vacío = sin límite). Guarda con “Guardar cambios”. Cambian al instante y puedes quitarlos cuando quieras.",
    ] },
    { id: "desactivar", q: "Una persona dejó la empresa", keywords: "desactivar reactivar baja", a: [
      "En su ficha toca “Desactivar acceso”: pierde el acceso de inmediato y su historial se conserva. Puedes reactivarla después. Quitar a alguien no libera el historial de lo que hizo.",
    ] },
  ] },
  { id: "suppliers", title: "Suppliers (para contratistas)", blurb: "Tus supply houses y su conexión.", articles: [
    { id: "agregar-supplier", q: "¿Cómo agrego un supplier?", keywords: "supplier proveedor contacto", a: [
      "Suppliers → Agregar supplier: nombre de la empresa y un contacto (nombre, correo, teléfono). Puedes tener varios contactos y marcar uno como Principal. Si el correo parece compartido (ventas@, info@) te avisamos porque lo puede leer cualquiera de esa empresa.",
    ] },
    { id: "conectar-supply", q: "¿Cómo me conecto con un supplier que usa BidPower?", keywords: "código conexión connect cuenta supply", a: [
      "Pídele el código de conexión, ve a Suppliers → “Conectar con un código”, escríbelo y elige asociarlo a un supplier existente o crear uno nuevo. Queda “Conectado” y le envías las cotizaciones dentro de la app. Puedes Desconectar cuando quieras; lo ya enviado se conserva.",
    ] },
  ] },
  { id: "supply", title: "Cuenta Supply", blurb: "Para casas de suministros que reciben pedidos.", articles: [
    { id: "supply-bandeja", q: "Soy supplier: ¿dónde veo los pedidos?", keywords: "bandeja inbox solicitudes", a: [
      "En Bandeja ves los pedidos de cotización que te enviaron los contratistas, con filtros Por cotizar y Cotizados, el Bid Date y si vence hoy o mañana. Al abrir uno ves los ítems, planos, enlaces, especificaciones y notas.",
    ] },
    { id: "supply-responder", q: "¿Cómo respondo un pedido?", keywords: "responder cotización pdf total disponibilidad", a: [
      "Escribe tu número de cotización, total, disponibilidad y tiempo de entrega, o detalla por línea, y sube tu cotización en PDF. Si algo no está claro, haz una pregunta antes. Puedes ver si fuiste Adjudicado o No adjudicado. Si usas un enlace (sin cuenta) funciona igual.",
      "Nunca ves lo que el contratista cobra a su cliente ni su proyecto más allá de lo que te envió.",
    ] },
    { id: "supply-contratistas", q: "¿Cómo conecto a mis contratistas?", keywords: "código conexión contratistas", a: [
      "En Contratistas genera un “Código de conexión” (un solo uso, vence en 14 días, con una nota opcional como el nombre del contratista) y compártelo, o comparte el enlace de registro. Ves cuántas solicitudes, cotizaciones y adjudicaciones tienes con cada uno y puedes Revocar la conexión.",
    ] },
  ] },
  { id: "takeoffs", title: "Takeoffs", blurb: "Conteos y estimados preliminares de materiales.", articles: [
    { id: "que-es-takeoff", q: "¿Qué es un Takeoff y cómo funciona?", keywords: "takeoff planos conteos paneles feeders preliminar", a: [
      "Dentro de un proyecto, Takeoffs te deja anotar lo que cuentas y mides: conteos (luminarias, dispositivos, gear, otros), paneles y circuitos, y feeders (longitud, calibre, conduit, desperdicio %). Con eso arma una lista preliminar de materiales.",
      "Todo es PRELIMINAR: BidPower no lee los planos ni hace análisis automático; tú cuentas. Puedes subir los planos como referencia y marcar el takeoff como Verificado (si cambias un número vuelve a “sin verificar”).",
    ] },
  ] },
  { id: "configuracion", title: "Configuración y plan", blurb: "Datos de empresa, logo, plan y notificaciones.", articles: [
    { id: "datos-empresa", q: "¿Cómo cambio los datos y el logo de mi empresa?", keywords: "empresa logo moneda zona horaria", a: [
      "Más → Configuración → Datos de la empresa (solo Owner): nombre, teléfono, moneda, email, dirección, logo (PNG, JPG o WebP, máximo 5 MB) y zona horaria. Salen en tus propuestas, órdenes de compra y facturas. La zona horaria define qué es “hoy” para vencimientos y recordatorios.",
    ] },
    { id: "plan", q: "¿Qué incluye mi plan?", keywords: "plan free pro límites", a: [
      "El plan Free incluye hasta 3 proyectos activos, 3 empleados, 3 propuestas al mes, 50 gastos al mes y 20 órdenes de compra al mes. Cuando llegas a un límite la app te lo dice. Ves tu plan en Configuración → Plan y facturación.",
    ] },
    { id: "comentarios", q: "¿Cómo envío un comentario o reporto un problema?", keywords: "feedback ayuda comentarios error", a: [
      "Más → Ayuda y comentarios. Escribe qué hacías y qué viste; se guarda la página donde estabas y ves tus mensajes anteriores.",
    ] },
  ] },
  { id: "app", title: "App e instalación", blurb: "Instalar en iPhone, Android y computadora.", articles: [
    { id: "instalar-iphone", q: "¿Cómo la instalo en el iPhone o iPad?", keywords: "pwa instalar pantalla de inicio safari", a: [
      "Abre BidPower en Safari, toca Compartir y luego “Agregar a pantalla de inicio”. Se abre como una app, a pantalla completa.",
    ] },
    { id: "instalar-android", q: "¿Y en Android o en la computadora?", keywords: "chrome instalar android windows", a: [
      "En Chrome o Edge toca “Instalar” cuando la app lo ofrece (Más → Instalar) o usa el menú del navegador → Instalar aplicación.",
    ] },
    { id: "sin-internet", q: "¿Funciona sin internet?", keywords: "offline conexión", a: [
      "Necesita conexión para guardar y ver tus datos. Sin internet verás una página de aviso; al volver la conexión continúas donde estabas.",
    ] },
    { id: "falla", q: "Algo no funciona", keywords: "error bug problema lento", a: [
      "Cierra y vuelve a abrir la app o recarga la página. Si sigue, cuéntanos en Más → Ayuda y comentarios qué estabas haciendo.",
    ] },
  ] },
];
