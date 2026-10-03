import type { HelpTopic } from "./types";

// Todas as telas e funções do app, com as palavras que o próprio app usa. Passos são linhas "1. ".
export const helpPt: HelpTopic[] = [
  { id: "comecar", title: "Primeiros passos", blurb: "Conta, empresa e como tudo se conecta.", articles: [
    { id: "como-funciona", q: "Como o BidPower funciona do início ao fim?", keywords: "fluxo resumo processo ciclo", a: [
      "Tudo gira em torno do projeto. O caminho típico é:",
      "1. Cliente → Projeto.",
      "2. Lista de material do projeto (você ou sua equipe monta).",
      "3. Da lista: “Comprar agora” (pedido de compra) ou “Pedir cotação aos fornecedores” (você compara preços e adjudica).",
      "4. Pedido de compra → o fornecedor entrega → você anexa o recibo → o custo real entra no projeto.",
      "5. Proposta para seu cliente → ele aprova pelo link → fatura → você registra os pagamentos.",
      "A proposta (o que você cobra do cliente) e a cotação (o que você pede ao fornecedor) são coisas diferentes e nunca se misturam: o cliente jamais vê custos ou margens e o fornecedor jamais vê o que você cobra.",
    ] },
    { id: "criar-conta", q: "Como crio minha conta?", keywords: "cadastro registrar sign up", a: [
      "Acesse Criar conta, informe nome, e-mail e senha e depois o nome da empresa. Se você é uma casa de suprimentos (supply), escolha essa opção para receber pedidos de cotação de empreiteiros.",
      "Se foi convidado para uma equipe, abra o link do convite: seu e-mail já vem preenchido e você entra naquela empresa.",
    ] },
    { id: "esqueci", q: "Esqueci minha senha", keywords: "recuperar senha redefinir", a: [
      "No login toque em “Esqueceu sua senha?”. Um link seguro chega ao seu e-mail para criar uma nova. Verifique também o spam.",
    ] },
    { id: "idioma-tema", q: "Como troco o idioma ou o tema escuro?", keywords: "español english português idioma tema escuro claro", a: [
      "O idioma muda no botão pequeno de idioma (ES / EN / PT) no topo, ou em Mais → Configurações → Idioma. O tema (claro, escuro ou automático conforme o dispositivo) fica em Configurações → Tema.",
    ] },
    { id: "funcoes-resumo", q: "O que cada pessoa vê?", keywords: "owner manager employee supply cliente privacidade", a: [
      "- Proprietário (Owner): tudo, incluindo equipe, configurações e lucro.",
      "- Gerente (Manager): gerencia projetos, compras e clientes; o lucro só se o Owner permitir.",
      "- Funcionário: só os projetos atribuídos; pede material, envia recibos e compra se tiver permissão.",
      "- Fornecedor: só os pedidos de cotação que você envia.",
      "- Cliente: só a proposta ou o documento que você compartilha por link.",
    ] },
  ] },
  { id: "inicio", title: "Início, busca e calendário", blurb: "O que precisa da sua atenção e como achar qualquer coisa.", articles: [
    { id: "inicio-owner", q: "O que mostra a tela de Início?", keywords: "dashboard atenção aguardando", a: [
      "- Requer atenção: o que você precisa resolver hoje (material pedido, fornecedor que respondeu, cotação que vence, PO sem recibo, cliente que pediu mudanças, fatura vencida, proposta pronta para faturar). Se não há nada, diz “Tudo em dia”.",
      "- Aguardando: quem tem a próxima ação em cada item (fornecedor, cliente, funcionário ou você).",
      "- Compras da equipe: quem comprou onde e quais recibos faltam.",
      "- Atalhos: Novo projeto, Material, Nova proposta, Nova despesa.",
      "- Seus projetos ativos.",
    ] },
    { id: "inicio-funcionario", q: "E a tela de Início de um funcionário?", keywords: "funcionário recibos pedir comprar", a: [
      "Mostra os recibos a enviar (enquanto houver algum pendente você não pode fazer outra compra), o botão para pedir material, o valor que você pode comprar sem aprovação e “Meus pedidos e compras”.",
    ] },
    { id: "buscar", q: "Como busco algo?", keywords: "busca buscar encontrar", a: [
      "Use a lupa ou a barra do Início. Digite pelo menos 2 letras e busca ao mesmo tempo projetos, clientes, propostas e faturas (por número), pedidos de compra, listas de material, pedidos de cotação, materiais e fornecedores. Cada funcionário só encontra o que pode ver.",
    ] },
    { id: "calendario", q: "O que há no Calendário?", keywords: "datas entregas vencimentos", a: [
      "Mostra por mês as entregas esperadas dos pedidos de compra, os vencimentos de faturas a receber, as datas limite de resposta das cotações, as propostas que vencem e o fim estimado dos projetos; abaixo, os projetos programados pela data de início. As datas usam o fuso horário da sua empresa.",
    ] },
  ] },
  { id: "projetos", title: "Projetos", blurb: "O centro de tudo: status, dinheiro e equipe.", articles: [
    { id: "criar-projeto", q: "Como crio um projeto?", keywords: "novo projeto cliente status", a: [
      "1. Projetos → Novo projeto (ou o botão + do Início).",
      "2. Informe o nome, escolha o cliente (ou crie um ali mesmo com “+ Novo cliente”) e o endereço.",
      "3. Em “Mais detalhes” você pode colocar data de início, valor do contrato, orçamento (materiais, mão de obra, subempreiteiros, outros) e notas.",
      "Se o projeto tem data de início, aparece no Calendário.",
    ] },
    { id: "status", q: "O que significa cada status do projeto?", keywords: "lead cotado aprovado ativo pausa concluído cancelado", a: [
      "Lead (oportunidade), Cotado (você já enviou proposta), Aprovado, Ativo (em execução), Em pausa, Concluído e Cancelado. Você pode filtrar a lista por status e alterá-lo ao editar o projeto.",
    ] },
    { id: "controle-projeto", q: "O que é o Controle do projeto?", keywords: "orçamento custo real comprometido lucro", a: [
      "É o resumo de dinheiro dentro de cada projeto (só para quem tem permissão de ver custos ou lucro):",
      "- Contrato e orçamento.",
      "- Custo real: o que já foi pago (despesas e pedidos de compra concluídos).",
      "- Comprometido: pedidos de compra abertos ainda não pagos. Vira custo real quando você conclui o PO.",
      "- Custo projetado e orçamento restante.",
      "- Lucro estimado. Avisa se você está perto ou acima do orçamento.",
      "- Faturado, recebido e a receber.",
      "São números operacionais para decidir, não contabilidade.",
    ] },
    { id: "equipe-projeto", q: "Como atribuo pessoas a um projeto?", keywords: "atribuir equipe funcionários", a: [
      "Dentro do projeto, em “Equipe do projeto”, toque em Atribuir ao lado da pessoa (antes você precisa convidá-la em Equipe). Os funcionários só veem os projetos em que estão atribuídos. Para tirar, toque em Remover.",
    ] },
    { id: "atividade", q: "O que é a Atividade do projeto?", keywords: "histórico timeline", a: [
      "Uma linha do tempo com tudo o que aconteceu: listas de material, pedidos de cotação, respostas de fornecedores, pedidos de compra, propostas, respostas do cliente, change orders e despesas.",
    ] },
    { id: "atalhos-projeto", q: "Quais atalhos um projeto tem?", keywords: "ferramentas takeoffs listas despesas", a: [
      "Do projeto você abre: Listas de material, Pedidos de compra, Propostas, Faturas, Despesas, Takeoffs e Calendário, já filtrados por aquele projeto. Você nunca escolhe o projeto de novo.",
    ] },
    { id: "editar-arquivar-projeto", q: "Como edito ou arquivo um projeto?", keywords: "editar arquivar excluir", a: [
      "No projeto toque em Editar projeto para mudar dados e status. Arquivar projeto o tira das listas ativas sem apagar o histórico. Os projetos ativos contam para o limite do seu plano.",
    ] },
  ] },
  { id: "clientes", title: "Clientes", blurb: "Seus clientes e o que devem a você.", articles: [
    { id: "criar-cliente", q: "Como adiciono um cliente?", keywords: "novo cliente contato", a: [
      "Clientes → Novo cliente. Pede nome da empresa ou pessoa, contato, e-mail, telefone, endereço e notas; só o nome é obrigatório.",
    ] },
    { id: "ficha-cliente", q: "O que vejo na ficha de um cliente?", keywords: "cliente detalhe deve", a: [
      "Seus dados, seus projetos, propostas e faturas, e quanto ele deve a você. Dali você cria um projeto ou uma proposta com o cliente já escolhido.",
    ] },
    { id: "arquivar-cliente", q: "Como edito ou arquivo um cliente?", keywords: "editar arquivar", a: [
      "Na ficha toque em Editar. Arquivar cliente o marca como inativo; seus projetos e documentos são mantidos. Os funcionários só veem os clientes dos projetos em que estão atribuídos.",
    ] },
  ] },
  { id: "materiais", title: "Materiais", blurb: "Biblioteca, listas de material e pedidos da equipe.", articles: [
    { id: "biblioteca", q: "Para que serve a biblioteca de materiais?", keywords: "biblioteca itens apelidos favoritos", a: [
      "É seu catálogo próprio de itens que você pede com frequência. Cada item tem descrição, número de peça, fabricante, unidade, categoria, notas e apelidos de campo (por exemplo “romex” ou “mud ring”) para achá-lo do jeito que você fala na obra. Você pode marcar favoritos. Ela aprende sozinha: o que você adiciona a uma lista como texto livre pode ser salvo na biblioteca.",
      "Para começar rápido, em Mais → Material → Biblioteca toque em “Carregar biblioteca padrão”: copia mais de 1000 materiais elétricos comuns (fio THHN, Romex, EMT, PVC, caixas, disjuntores, painéis, luminárias…) sem preços nem marcas, para você editar e completar. A busca entende abreviações e nomes colados: “thhn8blk” encontra “THHN 8 AWG stranded black”. Para adicionar um: Mais → Material → Biblioteca → Adicionar item. Arquivar um item não altera pedidos anteriores.",
    ] },
    { id: "historico-precos", q: "Posso ver o histórico de preços de um material?", keywords: "preço histórico mais baixo", a: [
      "Sim. Ao abrir um item você vê o que pagou (pedidos de compra) e o que foi cotado, com o menor preço recente e o fornecedor. Só vê quem tem permissão de ver custos.",
    ] },
    { id: "importar", q: "Como importo minha lista do Excel?", keywords: "importar excel csv modelo xlsx", a: [
      "1. Na biblioteca toque em “Importar lista (Excel ou CSV)”.",
      "2. Baixe o modelo (colunas: descrição, número de peça, fabricante, unidade, categoria e apelidos) ou use seu arquivo, ou cole as linhas do Excel.",
      "3. Confira a prévia (“N materiais prontos para importar”) e toque em Importar.",
      "Máximo de 2000 linhas por importação. Os que já existem são ignorados pelo número de peça e as linhas sem descrição são descartadas. Arquivos .xls antigos não são lidos: no Excel use Salvar como .xlsx ou CSV.",
    ] },
    { id: "montar-lista", q: "Como monto uma lista de material para um projeto?", keywords: "lista material pedido carrinho", a: [
      "1. Material → escolha o projeto (ou entre pelo projeto → Nova lista de material).",
      "2. Busque um item (por exemplo “thhn 8 vermelho x 500”: a quantidade é detectada sozinha) e toque em Adicionar à lista. Também há Favoritos, Recentes e Listas salvas.",
      "3. Se não existir, adicione como texto livre; marque “Salvar itens novos na biblioteca” se quiser reutilizá-lo.",
      "4. Você também pode Colar lista: cole do WhatsApp, e-mail ou Excel, um item por linha (por exemplo “20 x EMT 3/4”).",
      "5. Marque “Permitir substituição” se aceita equivalentes, adicione notas e toque em Enviar pedido.",
      "Você pode salvar a lista com um nome para reutilizá-la em outro projeto.",
    ] },
    { id: "proximo-passo", q: "Já tenho a lista, e agora?", keywords: "comprar agora cotação próximo passo", a: [
      "Ao revisar uma lista, o BidPower pergunta o que você quer fazer:",
      "- Comprar agora: você já sabe onde comprar. Escolhe o fornecedor (ou digita outro), o valor estimado e o pedido de compra é criado com as linhas da lista.",
      "- Pedir cotação aos fornecedores: compare preços de vários e compre do melhor.",
      "O projeto e os materiais nunca são digitados de novo.",
    ] },
    { id: "revisar-pedido", q: "Meu funcionário pediu material, como reviso?", keywords: "revisar devolver pedido funcionário", a: [
      "Aparece em Requer atenção e em Material → Listas de material. Abra e escolha Marcar como revisado (com nota opcional) ou Devolver. Depois você decide se compra ou pede cotação. O funcionário pode cancelar o próprio pedido enquanto não foi revisado.",
    ] },
  ] },
  { id: "cotacoes", title: "Cotações aos fornecedores", blurb: "Pedir preços, comparar e adjudicar.", articles: [
    { id: "pedir-cotacao", q: "Como peço uma cotação aos meus fornecedores?", keywords: "pricing request pedir cotação bid date", a: [
      "Uma cotação sempre parte de uma lista de material (se você não tem uma, o BidPower leva você a criá-la).",
      "1. Pedidos de cotação → Pedir cotação, ou “Pedir cotação aos fornecedores” a partir da lista.",
      "2. Escolha a lista. Os materiais e o projeto vêm dela.",
      "3. Defina “Responder antes de” (Bid Date), se é entrega na obra ou retirada, e as especificações.",
      "4. Em “Mais opções” você pode colocar título, tipo (Gear, Lighting, Material ou Other) e links de plantas ou specs. Também pode enviar arquivos (plantas, PDFs).",
    ] },
    { id: "passos-cotacao", q: "Quais são os passos de uma cotação?", keywords: "passos status fluxo", a: [
      "Quatro passos que você vê no topo do pedido: 1 · O que você pede, 2 · A quem pede, 3 · Respostas e 4 · Decidir.",
    ] },
    { id: "enviar-fornecedor", q: "Como envio ao fornecedor?", keywords: "link seguro conta supply enviar e-mail", a: [
      "No passo 2 você escolhe o fornecedor e o contato:",
      "- Se o fornecedor tem conta Supply conectada (selo “Conta Supply”), toque em “Enviar para a conta Supply”: ele verá na caixa de entrada.",
      "- Se não, “Criar link seguro”: defina os dias de validade, copie o link e envie por WhatsApp ou e-mail. O link aparece uma só vez; se perder, revogue e crie outro.",
      "O BidPower ainda não envia e-mails por você: você compartilha o link ou usa “Copiar texto para enviar” e depois toca em “Marcar como enviado”. Você vê se o link foi aberto, quando vence e pode Revogá-lo.",
    ] },
    { id: "registrar-resposta", q: "O fornecedor respondeu, como registro o preço?", keywords: "resposta cotação total pdf registrar", a: [
      "Se respondeu pelo link ou pela conta, a resposta aparece sozinha. Se enviou por outro meio toque em Registrar resposta: informe fornecedor, número da cotação, total, disponibilidade, prazo de entrega, frete e imposto, e anexe o PDF. Se só tem o total, informe só o total; o detalhe por linha é opcional.",
      "Os preços só são vistos por quem tem permissão de ver custos.",
    ] },
    { id: "perguntas-fornecedor", q: "O fornecedor me fez uma pergunta", keywords: "perguntas responder", a: [
      "Aparece em “Perguntas do fornecedor” dentro do pedido e em Requer atenção. Toque em Responder e o fornecedor recebe sua resposta no link ou na caixa de entrada.",
    ] },
    { id: "adjudicar", q: "Como comparo e escolho o vencedor?", keywords: "adjudicar melhor preço comparar", a: [
      "No passo 3 você vê todas as respostas, com a etiqueta “Melhor preço”. Toque em Adjudicar na escolhida: as demais ficam recusadas. Depois toque em “Criar pedido de compra” e ele é gerado com aquela resposta. Se o pedido já existe aparece “Ver PO-…”.",
    ] },
    { id: "fechar-cancelar", q: "Posso fechar ou cancelar um pedido de cotação?", keywords: "fechar cancelar", a: [
      "Sim: Fechar dá o pedido por encerrado e Cancelar o anula. Os links já enviados seguem o status do pedido.",
    ] },
  ] },
  { id: "compras", title: "Pedidos de compra", blurb: "Comprar, receber e fechar com o recibo.", articles: [
    { id: "criar-po", q: "Como crio um pedido de compra (PO)?", keywords: "po pedido compra criar", a: [
      "Há dois caminhos: “Comprar agora” a partir de uma lista de material, ou “Criar pedido de compra” a partir da resposta adjudicada de uma cotação. Também pode ir em Pedidos de compra → Novo. Leva o fornecedor, o projeto, as linhas e o valor estimado, e se numera sozinho (PO-…).",
    ] },
    { id: "status-po", q: "O que significam os status de um pedido?", keywords: "status po enviado recebido concluído", a: [
      "Aguardando aprovação (passa do limite de quem criou), Aprovado, Rejeitado, Enviado (você mandou ao fornecedor), Recebido, Sem documento (falta o recibo), Documento recebido, Em revisão, Concluído e Cancelado. Na lista você pode filtrar Aguardando aprovação, Em andamento ou Concluído.",
    ] },
    { id: "limite-aprovacao", q: "Meu PO “aguarda aprovação”, por quê?", keywords: "limite aprovar rejeitar funcionário permissão", a: [
      "O Owner define se você pode comprar e até que valor. Se o PO passa do seu limite, fica em “Aguardando aprovação” e o Owner ou um Manager Aprova ou Rejeita (com nota opcional). Um valor desconhecido nunca ultrapassa o limite.",
    ] },
    { id: "enviar-receber", q: "Como marco que foi enviado e que chegou?", keywords: "enviado recebido entrega esperada parcial", a: [
      "Toque em “Marcar como enviado ao fornecedor” quando enviar. Você pode definir a Entrega esperada: se atrasar, avisamos no Início. Quando o pedido chegar, use “Tudo chegou” ou “Salvar o recebido” para informar a quantidade recebida de cada linha (recebimentos parciais: “Recebido 3 de 5”).",
    ] },
    { id: "recibo-po", q: "Como fecho o PO com o recibo?", keywords: "recibo foto concluir documento packing slip", a: [
      "1. No PO toque na câmera (“Tirar foto do recibo”) ou escolha uma foto/arquivo. Pode ser recibo, fatura ou packing slip.",
      "2. Informe o custo real e o imposto incluído que consta no documento.",
      "3. Toque em Concluir PO.",
      "Sem documento não dá para concluir. Ao concluir, o custo real é registrado como despesa do projeto e deixa de estar “comprometido”. São aceitos PDF, JPG, PNG e WebP (inclusive fotos do iPhone) de até 10 MB.",
    ] },
    { id: "cancelar-po", q: "Posso cancelar um pedido?", keywords: "cancelar po histórico", a: [
      "Sim, com Cancelar PO enquanto não estiver concluído. O Histórico do pedido guarda cada mudança de status e quem a fez.",
    ] },
  ] },
  { id: "despesas", title: "Despesas e recibos", blurb: "Registrar despesas e aprová-las.", articles: [
    { id: "nova-despesa", q: "Como registro uma despesa?", keywords: "despesa nova foto recibo categoria", a: [
      "Despesas → Nova despesa (ou o botão + do Início). Escolha o projeto (ou “Sem projeto”), fornecedor, categoria, valor, data, notas e a foto ou arquivo do recibo, fatura ou packing slip.",
    ] },
    { id: "aprovar-despesa", q: "A despesa de um funcionário fica “aguardando aprovação”", keywords: "aprovar rejeitar despesa pendente", a: [
      "É normal: a despesa de um funcionário fica pendente até o Owner ou um Manager aprovar e, até lá, não conta como custo do projeto. Quem a criou pode corrigi-la ou cancelá-la enquanto estiver pendente.",
    ] },
    { id: "categorias", q: "Como gerencio as categorias de despesas?", keywords: "categorias configurações", a: [
      "Mais → Configurações → Categorias de despesas (só o Owner). Crie as suas e ative ou desative as do sistema.",
    ] },
    { id: "regra-recibo", q: "Por que um funcionário não pode comprar de novo?", keywords: "recibo obrigatório bloqueio", a: [
      "Cada compra de um funcionário exige enviar a foto do recibo. Enquanto houver recibos pendentes ele não pode criar outra compra. Quando envia o recibo, volta a poder comprar. O Owner vê no Início quem tem recibos atrasados.",
    ] },
  ] },
  { id: "propostas", title: "Propostas e mudanças", blurb: "O que você envia ao cliente para aprovar.", articles: [
    { id: "criar-proposta", q: "Como crio uma proposta?", keywords: "proposal proposta nova itens imposto", a: [
      "1. Propostas → Nova proposta (ou a partir do projeto ou do cliente).",
      "2. Escolha cliente e projeto, e o imposto %.",
      "3. Em Itens adicione artigos: ao digitar na descrição ele sugere itens da sua biblioteca; informe número de peça, unidade (peça, pé, caixa, rolo, hora, lote), quantidade e preço. Pode adicionar notas por linha.",
      "4. Adicione termos e notas e salve. O total é calculado sozinho.",
    ] },
    { id: "enviar-proposta", q: "Como envio ao cliente?", keywords: "link cliente enviar copiar", a: [
      "Na proposta toque em “Criar link e enviar”, informe o nome do cliente (e o e-mail, opcional), copie o link e envie por WhatsApp ou e-mail. O cliente não precisa de conta. O link aparece uma só vez; se perder, revogue e crie outro. Em “Links para o cliente” você vê se ele abriu.",
    ] },
    { id: "cliente-responde", q: "Como meu cliente aprova ou pede mudanças?", keywords: "aprovar assinar mudanças", a: [
      "Ele abre o link, revisa a proposta e aprova digitando o nome, ou pede mudanças com uma mensagem. Você vê a resposta na proposta e em Requer atenção. A aprovação guarda nome, data, hora e IP: não é assinatura manuscrita nem assinatura eletrônica certificada.",
      "O cliente só vê itens, imposto e total: nunca custos, margens ou fornecedores.",
    ] },
    { id: "versoes", q: "Já enviei e quero mudar", keywords: "versão nova editar bloqueada", a: [
      "Uma proposta enviada não se edita. Toque em “Nova versão”: cria-se uma cópia editável e a atual fica substituída (seus links deixam de funcionar). As versões aparecem em “Versões”.",
    ] },
    { id: "decisao-manual", q: "O cliente aprovou por telefone ou pessoalmente", keywords: "decisão manual aprovar fora", a: [
      "Use “Registrar decisão manual” → “O cliente aprovou fora do app” (ou recusou). Fica salvo como decisão manual, sem link do cliente.",
    ] },
    { id: "change-orders", q: "O que são Change Requests e Change Orders?", keywords: "mudanças change order adicional crédito", a: [
      "Se o cliente pede mudanças pelo link, aparece em “Mudanças pedidas pelo cliente”. Dali você pode Recusar ou Criar Change Order.",
      "Um Change Order tem título, descrição e linhas; preço negativo é crédito. Ao ser aprovado, a diferença é somada ao valor do contrato do projeto.",
    ] },
    { id: "margem", q: "Onde vejo a margem de uma proposta aprovada?", keywords: "margem lucro", a: [
      "Na proposta aprovada, o cartão “Margem do projeto” compara o contrato com o custo real mais o comprometido. Só vê quem tem permissão de ver lucro.",
    ] },
  ] },
  { id: "faturas", title: "Faturas e recebimentos", blurb: "Faturar, registrar pagamentos e status.", articles: [
    { id: "fatura-proposta", q: "Como emito uma fatura a partir de uma proposta?", keywords: "faturar adiantamento percentual", a: [
      "1. Em uma proposta aprovada, cartão Faturamento → Criar fatura.",
      "2. Escolha quanto cobrar: tudo, uma porcentagem (por exemplo um adiantamento de 30%) ou “O que falta”.",
      "3. Confira vencimento e notas e salve como rascunho.",
      "O cartão mostra “Faturado X de Y”; quando tudo é faturado avisa que a proposta já está totalmente faturada.",
    ] },
    { id: "fatura-manual", q: "Posso fazer uma fatura sem proposta?", keywords: "fatura manual nova", a: [
      "Sim: Faturas → Nova fatura. Escolha cliente, vencimento, descrição e valor. O número é sugerido e nunca se repete.",
    ] },
    { id: "status-fatura", q: "O que significam os status da fatura?", keywords: "rascunho enviada parcial paga vencida", a: [
      "Rascunho, Enviada, Pagamento parcial, Paga, Vencida (passou da data sem ser paga por completo) e Cancelada. O status se atualiza sozinho conforme os pagamentos e o vencimento.",
    ] },
    { id: "registrar-pagamento", q: "Meu cliente me pagou, como registro?", keywords: "pagamento registrar cobrar", a: [
      "Abra a fatura, toque em Registrar pagamento manual, informe o valor e confirme; ou “Marcar como paga” se pagou tudo. O saldo se recalcula sozinho. O BidPower não cobra seu cliente nem processa cartões: o dinheiro circula fora e você registra.",
    ] },
    { id: "pdf-fatura", q: "Como envio a fatura?", keywords: "pdf imprimir enviar", a: [
      "A fatura tem PDF com o logo e os dados da sua empresa. Baixe e envie por e-mail ou WhatsApp e toque em “Marcar como enviada”. Uma fatura cancelada não pode ser desfeita; só pode ser cancelada se não tiver pagamentos.",
    ] },
  ] },
  { id: "relatorios", title: "Relatórios e contabilidade", blurb: "Números do negócio e exportação.", articles: [
    { id: "relatorios", q: "O que mostram os Relatórios?", keywords: "relatórios vendas despesas lucro conversão", a: [
      "Vendas contratadas, propostas aprovadas, despesas, lucro estimado, faturas pendentes e vencidas, projetos por status e conversão de propostas (total, aprovadas, pendentes). Só para Owner e Manager, e podem ser exportados.",
    ] },
    { id: "exportar", q: "Como exporto dados para meu contador ou QuickBooks?", keywords: "contabilidade exportar csv json quickbooks", a: [
      "Mais → Contabilidade (Owner ou Manager). Escolha os dados a exportar, o formato (CSV ou JSON; todos juntos só em JSON), o intervalo de datas e opcionalmente um projeto, e toque em Baixar. Só são exportadas despesas aprovadas e reembolsadas.",
      "O BidPower não é contabilidade e ainda não sincroniza direto com o QuickBooks. Abaixo você vê o histórico de exportações.",
    ] },
  ] },
  { id: "equipe", title: "Equipe e permissões", blurb: "Convidar pessoas e decidir o que podem fazer.", articles: [
    { id: "convidar", q: "Como convido um funcionário ou gerente?", keywords: "convite equipe funcionário", a: [
      "1. Equipe → Convidar funcionário.",
      "2. Informe nome completo e e-mail, e escolha o modelo (Funcionário básico, Funcionário com compras ou Manager) e os projetos.",
      "3. Copie o link ou compartilhe por WhatsApp. É de uso único, vence em 7 dias e aparece uma só vez. A pessoa deve se cadastrar com esse mesmo e-mail.",
      "Em “Convites pendentes” você pode Revogar. O plano Free permite até 3 funcionários.",
    ] },
    { id: "modelos", q: "O que inclui cada modelo?", keywords: "modelo básico compras manager", a: [
      "- Funcionário básico: pede material e envia recibos e documentos. Não compra.",
      "- Funcionário com compras: o anterior, mais criar pedidos de compra até $500 sem aprovação (você pode mudar o limite).",
      "- Manager: gerencia projetos, compras, cotações, propostas e biblioteca; vê custos mas não lucro, a menos que você permita.",
    ] },
    { id: "permissoes", q: "Quais permissões individuais existem?", keywords: "permissões pedir material enviar documentos biblioteca po custos lucro", a: [
      "Na ficha de cada pessoa (Equipe → pessoa → Permissões) você liga ou desliga: pedir material, enviar documentos, gerenciar a biblioteca, criar pedidos de cotação, criar PO, enviar PO, ver custos, ver lucro e criar propostas, mais o Limite de PO (vazio = sem limite). Salve com “Salvar alterações”. Valem na hora e você pode removê-las quando quiser.",
    ] },
    { id: "desativar", q: "Alguém saiu da empresa", keywords: "desativar reativar saída", a: [
      "Na ficha toque em “Desativar acesso”: a pessoa perde o acesso na hora e o histórico é mantido. Você pode reativá-la depois.",
    ] },
  ] },
  { id: "fornecedores", title: "Fornecedores (para empreiteiros)", blurb: "Suas casas de suprimentos e a conexão com elas.", articles: [
    { id: "adicionar-fornecedor", q: "Como adiciono um fornecedor?", keywords: "fornecedor supplier contato", a: [
      "Fornecedores → Adicionar fornecedor: nome da empresa e um contato (nome, e-mail, telefone). Pode ter vários contatos e marcar um como Principal. Se o e-mail parece compartilhado (vendas@, info@), avisamos porque qualquer pessoa dessa empresa pode lê-lo.",
    ] },
    { id: "conectar-supply", q: "Como me conecto com um fornecedor que usa o BidPower?", keywords: "código conexão connect conta supply", a: [
      "Peça o código de conexão, vá em Fornecedores → “Conectar com um código”, digite-o e escolha associá-lo a um fornecedor existente ou criar um novo. Fica “Conectado” e você envia as cotações dentro do app. Pode Desconectar quando quiser; o que já foi enviado é mantido.",
    ] },
  ] },
  { id: "supply", title: "Conta Supply", blurb: "Para casas de suprimentos que recebem pedidos.", articles: [
    { id: "supply-caixa", q: "Sou fornecedor: onde vejo os pedidos?", keywords: "caixa de entrada inbox solicitações", a: [
      "Na Caixa de entrada você vê os pedidos de cotação enviados pelos empreiteiros, com filtros A cotar e Cotados, o Bid Date e se vence hoje ou amanhã. Ao abrir um você vê os itens, plantas, links, especificações e notas.",
    ] },
    { id: "supply-responder", q: "Como respondo a um pedido?", keywords: "responder cotação pdf total disponibilidade", a: [
      "Informe seu número de cotação, total, disponibilidade e prazo de entrega, ou detalhe por linha, e envie sua cotação em PDF. Se algo não está claro, faça uma pergunta antes. Você vê se foi Adjudicado ou Não adjudicado. Se usa um link (sem conta) funciona igual.",
      "Você nunca vê o que o empreiteiro cobra do cliente nem o projeto dele além do que ele enviou.",
    ] },
    { id: "supply-empreiteiros", q: "Como conecto meus empreiteiros?", keywords: "código conexão empreiteiros", a: [
      "Em Empreiteiros gere um “Código de conexão” (uso único, vence em 14 dias, com uma nota opcional como o nome do empreiteiro) e compartilhe, ou compartilhe o link de cadastro. Você vê quantas solicitações, cotações e adjudicações tem com cada um e pode Revogar a conexão.",
    ] },
  ] },
  { id: "takeoffs", title: "Takeoffs", blurb: "Contagens e estimativas preliminares de materiais.", articles: [
    { id: "o-que-e-takeoff", q: "O que é um Takeoff e como funciona?", keywords: "takeoff plantas contagens painéis feeders preliminar", a: [
      "Dentro de um projeto, Takeoffs permite anotar o que você conta e mede: contagens (iluminação, dispositivos, gear, outros), painéis e circuitos, e feeders (comprimento, bitola, conduíte, desperdício %). Com isso monta uma lista preliminar de materiais.",
      "Tudo é PRELIMINAR: o BidPower não lê as plantas nem faz análise automática; você conta. Você pode enviar as plantas como referência e marcar o takeoff como Verificado (se mudar um número, volta a não verificado).",
    ] },
  ] },
  { id: "configuracoes", title: "Configurações e plano", blurb: "Dados da empresa, logo, plano e comentários.", articles: [
    { id: "dados-empresa", q: "Como mudo os dados e o logo da minha empresa?", keywords: "empresa logo moeda fuso horário", a: [
      "Mais → Configurações → Dados da empresa (só Owner): nome, telefone, moeda, e-mail, endereço, logo (PNG, JPG ou WebP, máx. 5 MB) e fuso horário. Aparecem em suas propostas, pedidos de compra e faturas. O fuso horário define o que é “hoje” para vencimentos e lembretes.",
    ] },
    { id: "plano", q: "O que inclui meu plano?", keywords: "plano free pro limites", a: [
      "O plano Free inclui até 3 projetos ativos, 3 funcionários, 3 propostas por mês, 50 despesas por mês e 20 pedidos de compra por mês. Quando chega a um limite o app avisa. Você vê seu plano em Configurações → Plano e cobrança.",
    ] },
    { id: "comentarios", q: "Como envio um comentário ou relato um problema?", keywords: "feedback ajuda comentários erro", a: [
      "Mais → Ajuda e comentários. Escreva o que estava fazendo e o que viu; a página em que você estava fica registrada e você vê suas mensagens anteriores.",
    ] },
  ] },
  { id: "app", title: "App e instalação", blurb: "Instalar no iPhone, Android e computador.", articles: [
    { id: "instalar-iphone", q: "Como instalo no iPhone ou iPad?", keywords: "pwa instalar tela inicial safari", a: [
      "Abra o BidPower no Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”. Ele abre como um app, em tela cheia.",
    ] },
    { id: "instalar-android", q: "E no Android ou no computador?", keywords: "chrome instalar android windows", a: [
      "No Chrome ou Edge toque em “Instalar” quando o app oferecer (Mais → Instalar) ou use o menu do navegador → Instalar aplicativo.",
    ] },
    { id: "sem-internet", q: "Funciona sem internet?", keywords: "offline conexão", a: [
      "Precisa de conexão para salvar e ver seus dados. Sem internet você verá uma página de aviso; quando a conexão voltar, continue de onde parou.",
    ] },
    { id: "falha", q: "Algo não funciona", keywords: "erro bug problema lento", a: [
      "Feche e abra o app de novo ou recarregue a página. Se continuar, conte em Mais → Ajuda e comentários o que estava fazendo.",
    ] },
  ] },
];
