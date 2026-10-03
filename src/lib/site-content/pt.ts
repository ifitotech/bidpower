import type { SiteContent } from "./types";

const pt: SiteContent = {
  ui: {
    back: "Voltar", updated: "Última atualização", onThisPage: "Nesta página", contactTitle: "Precisa falar com uma pessoa?",
    contactBody: "Conte o que aconteceu e o que você esperava. Quanto mais claro, mais rápido ajudamos.",
    contactInApp: "Dentro do app: Mais → Ajuda e comentários.", emailUs: "Escreva para", operator: "Responsável pelo serviço",
    helpTitle: "Central de ajuda", helpIntro: "Respostas curtas para o dia a dia: materiais, compras, propostas, faturas e equipe.",
    searchPh: "Busque: comprar, fatura, funcionário, instalar…", noResults: "Não encontramos nada para essa busca. Tente outra palavra ou fale conosco.",
    startTitle: "Comece em 5 passos",
    startSteps: [
      "Crie sua conta e preencha os dados da empresa em Mais → Configurações (nome, logo, moeda, fuso horário).",
      "Adicione seu cliente e crie o projeto: todo o resto fica dentro do projeto.",
      "Monte a lista de materiais. Escolha “Comprar agora” para gerar o pedido de compra, ou “Pedir cotação aos fornecedores” para comparar preços.",
      "Crie a proposta para seu cliente e envie o link seguro: ele pode aprovar ou pedir mudanças sem instalar nada.",
      "Conforme o trabalho avança, fature a partir da proposta aprovada e registre os pagamentos recebidos.",
    ],
    legalLinks: "Informações legais", terms: "Termos e condições", privacy: "Política de privacidade", help: "Ajuda",
    acceptNote: "Ao criar sua conta você aceita os", footerRights: "Todos os direitos reservados.", print: "Imprimir", topics: "Temas", related: "Relacionado",
  },
  terms: {
    title: "Termos e condições",
    summaryTitle: "Em palavras simples",
    summary: [
      "O BidPower é uma ferramenta para organizar sua operação: projetos, clientes, materiais, compras, propostas, faturas e equipe.",
      "Seus dados são seus. Você decide quem da equipe vê o quê. Você é responsável pelo que envia a seus clientes e fornecedores.",
      "O BidPower não cobra por você, não processa pagamentos e não substitui seu contador nem seu advogado.",
    ],
    sections: [
      { id: "aceitacao", title: "1. Aceitação dos termos", body: [
        "Ao criar uma conta, entrar ou usar o BidPower, você aceita estes termos e a Política de privacidade. Se usa o BidPower em nome de uma empresa, declara ter autoridade para obrigá-la.",
        "Se não concordar, não use o serviço.",
      ] },
      { id: "servico", title: "2. O que o BidPower é e o que não é", body: [
        "O BidPower é um aplicativo web e instalável (PWA) para empreiteiros, suas equipes e seus fornecedores. Ele permite:",
        "- Criar e controlar projetos e clientes.",
        "- Montar listas de materiais, pedir preços a um fornecedor e gerar pedidos de compra.",
        "- Criar propostas para clientes, compartilhá-las por link seguro e registrar a resposta.",
        "- Registrar despesas e recibos, emitir faturas e registrar os pagamentos recebidos.",
        "- Convidar funcionários com permissões individuais.",
        "O BidPower não é um sistema de contabilidade, não declara impostos, não é assessoria jurídica, fiscal, contábil ou de engenharia, e não é parte de nenhuma transação entre empreiteiros, clientes e fornecedores.",
      ] },
      { id: "contas", title: "3. Contas, funções e segurança", body: [
        "Você deve fornecer informações verdadeiras e mantê-las atualizadas. É responsável pela atividade da sua conta e por proteger sua senha.",
        "O proprietário (owner) da conta da empresa decide quem faz parte da equipe, qual função tem (proprietário, gerente ou funcionário) e quais permissões individuais recebe: pedir materiais, enviar recibos, criar ou enviar pedidos de compra, ver custos ou lucro e limites de valor. Ele pode alterá-las ou desativar uma pessoa a qualquer momento; o histórico é mantido.",
        "Avise-nos imediatamente se suspeitar que alguém acessou sua conta sem permissão.",
      ] },
      { id: "uso", title: "4. Uso aceitável", body: [
        "Você não pode usar o BidPower para:",
        "- Atividades ilegais, fraudulentas ou enganosas, inclusive enviar propostas, faturas ou cotações com informações falsas.",
        "- Acessar dados de outras empresas, testar ou burlar medidas de segurança, ou sobrecarregar o serviço.",
        "- Enviar vírus, conteúdo malicioso ou arquivos que você não tem direito de compartilhar.",
        "- Revender o serviço ou copiá-lo sem autorização.",
      ] },
      { id: "conteudo", title: "5. Seu conteúdo e seus dados", body: [
        "Os projetos, clientes, preços, documentos, fotos e demais informações que você envia são seus. Você nos dá a permissão limitada necessária para armazená-los, mostrá-los às pessoas que você autorizar e operar o serviço.",
        "Você é responsável por ter o direito de enviar os dados de seus clientes, funcionários e fornecedores e por cumprir as leis aplicáveis ao tratá-los.",
        "Os arquivos permitidos são PDF, JPG, PNG e WebP de até 10 MB cada.",
        "Guarde cópias dos seus documentos importantes. Você pode exportar seus dados operacionais em CSV ou JSON em Contabilidade.",
      ] },
      { id: "links", title: "6. Documentos compartilhados com clientes e fornecedores", body: [
        "Propostas, pedidos de compra e solicitações de preço são compartilhados por links seguros. Quem tiver o link pode ver aquele documento; por isso envie-o só à pessoa certa e trate-o como privado. O cliente não vê custos de fornecedor, margens nem informações internas; o fornecedor não vê o que você cobra do seu cliente.",
        "Quando um cliente aprova uma proposta, o BidPower registra o nome digitado e a data e hora. Esse registro não é uma assinatura eletrônica certificada. Se precisar de uma assinatura com validade jurídica especial, use um contrato assinado separadamente.",
        "Os preços, a disponibilidade e os prazos de entrega informados por um fornecedor são de responsabilidade dele. O BidPower apenas os exibe.",
      ] },
      { id: "faturas", title: "7. Faturas, pagamentos e impostos", body: [
        "O BidPower ajuda a preparar faturas e a registrar os pagamentos que você recebe. Ele não cobra seus clientes nem processa pagamentos: o dinheiro circula fora do BidPower e você o registra.",
        "Você é responsável por garantir que faturas, impostos, números de documento e prazos cumpram as normas do seu país ou estado.",
      ] },
      { id: "planos", title: "8. Planos e limites", body: [
        "O plano Free inclui até 3 projetos ativos, 3 funcionários, 3 propostas por mês, 50 despesas por mês e 20 pedidos de compra por mês. Os planos pagos removerão esses limites.",
        "Antes de cobrar qualquer valor, mostraremos o preço e as condições e aguardaremos sua confirmação. Se alterarmos limites ou preços de um plano, avisaremos com antecedência razoável.",
      ] },
      { id: "disponibilidade", title: "9. Disponibilidade e mudanças no serviço", body: [
        "Trabalhamos para que o BidPower esteja disponível e funcione bem, mas ele é oferecido “como está”: pode haver interrupções por manutenção, falhas de provedores ou causas fora do nosso controle. Sem conexão, só aparece uma página de aviso; as informações são salvas quando há internet.",
        "Podemos melhorar, alterar ou retirar funções. Se uma mudança afetar de forma importante o seu uso, avisaremos.",
      ] },
      { id: "propriedade", title: "10. Propriedade intelectual", body: [
        "O BidPower, seu design, marca e software pertencem ao seu titular. Estes termos não transferem a você nenhum direito sobre eles, exceto o direito limitado de usar o serviço enquanto cumprir os termos.",
        "Se nos enviar ideias ou comentários, poderemos usá-los para melhorar o serviço sem dever compensação.",
      ] },
      { id: "encerramento", title: "11. Suspensão e encerramento da conta", body: [
        "Você pode deixar de usar o BidPower quando quiser. Para encerrar sua conta e pedir a exclusão dos seus dados, fale conosco pelos meios de contato desta página.",
        "Podemos suspender ou encerrar uma conta que descumpra estes termos, ponha em risco a segurança do serviço ou seja usada para fraude, avisando quando possível.",
      ] },
      { id: "responsabilidade", title: "12. Garantias e limite de responsabilidade", body: [
        "Na medida em que a lei permitir, o BidPower não responde por perdas indiretas, lucros cessantes, perda de negócios ou decisões tomadas com as informações do app (por exemplo, orçamentos, lucro estimado ou preços de terceiros). Os valores exibidos pelo app são um auxílio operacional que você deve verificar.",
        "A responsabilidade total do BidPower perante você por qualquer reclamação limita-se ao valor que você pagou pelo serviço nos 12 meses anteriores ou, no plano gratuito, a um valor simbólico. Nada nestes termos exclui responsabilidades que a lei não permita excluir.",
      ] },
      { id: "mudancas", title: "13. Mudanças nestes termos", body: [
        "Podemos atualizar estes termos. Publicaremos a nova versão com sua data e, se a mudança for importante, avisaremos no app. Continuar usando o BidPower após a mudança significa que você a aceita.",
      ] },
      { id: "lei", title: "14. Lei aplicável", body: [
        "Estes termos são regidos pelas leis aplicáveis na jurisdição do responsável pelo serviço indicado no final desta página, sem prejuízo dos direitos que a lei do seu país lhe reconhece como usuário.",
      ] },
    ],
  },
  privacy: {
    title: "Política de privacidade",
    summaryTitle: "Em palavras simples",
    summary: [
      "Guardamos só o que você precisa para usar o BidPower: sua conta, os dados da empresa e o que você envia (projetos, clientes, documentos).",
      "Não vendemos seus dados, não exibimos publicidade e não usamos rastreadores de terceiros.",
      "Cada empresa vê somente seus próprios dados e, dentro da empresa, cada pessoa vê conforme suas permissões.",
    ],
    sections: [
      { id: "quem", title: "1. Quem é o responsável", body: [
        "O controlador dos dados é o responsável pelo serviço BidPower indicado no final desta página. Quanto aos dados de seus clientes e fornecedores que você envia, é você quem decide para que são usados, e o BidPower atua como provedor que os armazena por sua conta.",
      ] },
      { id: "dados", title: "2. Quais dados tratamos", body: [
        "- Conta: nome, e-mail, telefone (opcional) e senha. A senha é armazenada criptografada pelo sistema de autenticação; nunca podemos vê-la.",
        "- Empresa: nome, logo, endereço, moeda, fuso horário e dados para seus documentos.",
        "- Operação que você envia: projetos, clientes e seus contatos, listas de materiais, cotações, pedidos de compra, propostas, faturas, despesas, recibos, fotos e arquivos PDF.",
        "- Equipe: pessoas convidadas, sua função, permissões e atividade nos projetos (por exemplo, quem enviou um recibo).",
        "- Mensagens que você nos envia em Ajuda e comentários, com a página de onde escreveu.",
        "- Dados técnicos mínimos: registros do servidor e de erros para manter a segurança e corrigir falhas.",
        "Não pedimos dados de cartão nem de conta bancária.",
      ] },
      { id: "uso", title: "3. Para que usamos", body: [
        "- Prestar o serviço: entrar, salvar e mostrar suas informações, gerar seus documentos e links.",
        "- Manter a segurança, prevenir abusos e corrigir erros.",
        "- Responder suas dúvidas e melhorar o produto com seus comentários.",
        "- Cumprir obrigações legais quando aplicável.",
        "Não vendemos dados pessoais nem os usamos para publicidade.",
      ] },
      { id: "compartilhar", title: "4. Com quem compartilhamos", body: [
        "- Dentro da sua empresa: conforme a função e as permissões que você atribui.",
        "- Com seus clientes e fornecedores: somente o documento que você decide enviar por link seguro. Um fornecedor conectado vê apenas as solicitações que você envia; um cliente vê só o que você compartilha.",
        "- Provedores técnicos que operam o serviço: Supabase (banco de dados, autenticação e armazenamento de arquivos) e Vercel (hospedagem do aplicativo). Eles tratam os dados somente para prestar esse serviço.",
        "- Autoridades, quando uma lei ou ordem válida exigir.",
      ] },
      { id: "cookies", title: "5. Cookies e armazenamento local", body: [
        "Usamos apenas o necessário para o app funcionar:",
        "- Cookies de sessão de login.",
        "- Seu idioma e tema (cookie e armazenamento do navegador).",
        "- Um service worker que guarda apenas uma página de aviso para quando não há conexão.",
        "Não usamos cookies de publicidade nem ferramentas de análise de terceiros.",
      ] },
      { id: "seguranca", title: "6. Segurança", body: [
        "Os dados trafegam criptografados (HTTPS). O banco de dados aplica isolamento por empresa e regras de acesso por linha, de modo que uma empresa não consegue ler os dados de outra. Os links seguros usam códigos longos e aleatórios armazenados como hash, não em texto legível.",
        "Nenhum sistema é 100% invulnerável. Se detectarmos um incidente que afete seus dados, comunicaremos conforme a lei aplicável.",
      ] },
      { id: "retencao", title: "7. Por quanto tempo guardamos os dados", body: [
        "Enquanto sua conta estiver ativa. Quando uma pessoa sai da sua empresa, o acesso dela é desativado e o histórico fica nos seus projetos. Se você encerrar a conta, apagamos ou anonimizamos seus dados em prazo razoável, exceto o que a lei nos obrigue a manter.",
      ] },
      { id: "direitos", title: "8. Seus direitos", body: [
        "Você pode pedir acesso aos seus dados, corrigi-los, exportá-los, limitar o uso ou se opor, e pedir que os apaguemos. Parte disso você faz no próprio app (por exemplo, editar seu perfil e os dados da empresa). Para o resto, fale conosco pelos meios de contato desta página e responderemos em prazo razoável.",
        "Se achar que tratamos mal seus dados, você também pode recorrer à autoridade de proteção de dados do seu país.",
      ] },
      { id: "transferencias", title: "9. Transferências internacionais", body: [
        "Nossos provedores técnicos podem processar dados em servidores localizados fora do seu país. Quando isso ocorre, exigimos medidas de proteção adequadas.",
      ] },
      { id: "menores", title: "10. Menores de idade", body: [
        "O BidPower é para uso profissional e não é dirigido a menores de 18 anos.",
      ] },
      { id: "mudancas", title: "11. Mudanças nesta política", body: [
        "Se alterarmos esta política, publicaremos a nova versão com sua data e, se a mudança for importante, avisaremos no app.",
      ] },
    ],
  },
  help: [
    { id: "comecar", title: "Primeiros passos", blurb: "Conta, empresa e projeto.", articles: [
      { id: "criar-conta", q: "Como crio minha conta?", keywords: "cadastro registrar sign up", a: [
        "Acesse Criar conta, informe nome, e-mail e senha e depois o nome da empresa. Se você é um fornecedor (casa de suprimentos), escolha essa opção para receber pedidos de preço de empreiteiros.",
        "Se foi convidado para uma equipe, abra o link do convite: seu e-mail já vem preenchido e você entra naquela empresa.",
      ] },
      { id: "empresa", q: "Onde coloco o logo e os dados da empresa?", keywords: "configurações logo moeda fuso horário", a: [
        "Em Mais → Configurações (somente o proprietário). Lá ficam nome, logo, endereço, moeda e fuso horário. Eles aparecem nas suas propostas, pedidos de compra e faturas.",
        "O logo pode ser JPG, PNG ou WebP.",
      ] },
      { id: "projeto", q: "Como crio um projeto?", keywords: "novo projeto cliente", a: [
        "Primeiro adicione o cliente em Clientes e depois crie o projeto em Projetos → Novo. Dentro do projeto você tem materiais, compras, propostas, faturas, despesas e atividade; nunca precisa digitar o nome do projeto de novo.",
      ] },
      { id: "esqueci", q: "Esqueci minha senha", keywords: "recuperar senha redefinir", a: [
        "Na tela de login toque em “Esqueceu sua senha?”. Um link seguro chega ao seu e-mail para criar uma nova. Verifique também o spam.",
      ] },
      { id: "idioma", q: "Como troco o idioma?", keywords: "español english português idioma", a: [
        "Pelo seletor de idioma (no canto superior direito das telas de acesso e em Configurações dentro do app). O BidPower está disponível em espanhol, inglês e português.",
      ] },
    ] },
    { id: "materiais", title: "Materiais e compras", blurb: "Lista de materiais, comprar agora e pedidos de compra.", articles: [
      { id: "lista", q: "Como monto uma lista de materiais?", keywords: "material lista carrinho importar excel csv", a: [
        "No projeto abra Material. Busque na sua biblioteca, digite o item (por exemplo “10 disjuntores 20A”: a quantidade é detectada sozinha) ou importe uma lista de Excel/CSV. Cada vez que você adiciona algo, a biblioteca aprende para sugerir depois.",
      ] },
      { id: "comprar-agora", q: "O que é “Comprar agora”?", keywords: "pedido de compra PO comprar", a: [
        "Use quando você já sabe onde comprar. O pedido de compra é criado com sua lista, você o envia ao fornecedor e depois anexa o recibo. O custo entra no projeto quando você conclui a compra.",
      ] },
      { id: "pedir-cotacao", q: "O que é “Pedir cotação aos fornecedores”?", keywords: "cotação pricing request fornecedor", a: [
        "Use quando precisar comparar preços. Uma solicitação de preço é criada com sua lista e você a envia a um ou mais fornecedores. Quando o fornecedor responde, a resposta aparece na solicitação e, dali, você transforma a escolhida em pedido de compra.",
        "A solicitação de preço é para o fornecedor. A proposta é para seu cliente: são coisas diferentes e nunca se misturam.",
      ] },
      { id: "po-limite", q: "Por que não consigo criar ou enviar um pedido de compra?", keywords: "permissão limite aprovação funcionário", a: [
        "Seu proprietário decide se você pode comprar e até que valor. Se uma compra passar do seu limite, ela fica aguardando aprovação. Peça que ajuste sua permissão em Equipe.",
      ] },
      { id: "recibo", q: "Como envio um recibo?", keywords: "recibo foto comprovante", a: [
        "No pedido de compra toque na câmera e tire a foto do recibo. Funcionários devem entregar a foto do recibo antes de fazer outra compra. São aceitos JPG, PNG e WebP (inclusive fotos do iPhone) de até 10 MB.",
      ] },
    ] },
    { id: "propostas", title: "Propostas e clientes", blurb: "Enviar, aprovar e alterar propostas.", articles: [
      { id: "criar-proposta", q: "Como crio uma proposta para meu cliente?", keywords: "proposal orçamento", a: [
        "No projeto, Proposta → Nova. Adicione as linhas (você pode escolhê-las da biblioteca), impostos ou desconto, termos e notas. Quando estiver pronta, envie e compartilhe o link seguro com seu cliente.",
      ] },
      { id: "cliente-aprova", q: "Como meu cliente aprova?", keywords: "aprovar mudanças link", a: [
        "Ele abre o link sem precisar de conta, revisa a proposta e aprova digitando o nome, ou pede mudanças com um comentário. Você vê a resposta na proposta e no que precisa da sua atenção.",
        "A aprovação registra nome, data e hora; não é uma assinatura eletrônica certificada.",
      ] },
      { id: "cliente-ve", q: "O que meu cliente vê?", keywords: "privacidade custos margem", a: [
        "Apenas a proposta e o que você compartilha. Ele nunca vê preços de fornecedor, custos de pedidos de compra, margem nem lucro.",
      ] },
      { id: "versoes", q: "O cliente pediu mudanças, o que faço?", keywords: "versão revisar editar", a: [
        "Crie uma nova versão da proposta com as mudanças e envie de novo. A anterior fica no histórico.",
      ] },
    ] },
    { id: "faturas", title: "Faturas e dinheiro", blurb: "Faturar, registrar pagamentos e acompanhar custos.", articles: [
      { id: "faturar", q: "Como emito uma fatura?", keywords: "invoice fatura adiantamento", a: [
        "A partir de uma proposta aprovada escolha Faturar. Você pode faturar o total ou uma parte (por exemplo, um adiantamento). A fatura tem PDF para enviar e número próprio.",
      ] },
      { id: "pagamentos", q: "O BidPower cobra meu cliente?", keywords: "pagamento cobrar stripe cartão", a: [
        "Não. O BidPower não processa pagamentos. Quando seu cliente paga, você registra o pagamento na fatura e o saldo e o status se atualizam sozinhos (parcial, paga ou vencida).",
      ] },
      { id: "custos", q: "Onde vejo quanto ganho no projeto?", keywords: "lucro orçamento custo relatórios", a: [
        "No projeto você verá orçamento, custo real, custo comprometido e lucro estimado. Só veem isso as funções com permissão para ver custos ou lucro.",
        "São números operacionais para decidir, não contabilidade. Confirme com seu contador.",
      ] },
      { id: "exportar", q: "Posso exportar para meu contador?", keywords: "contabilidade quickbooks exportar csv", a: [
        "Sim. Em Mais → Contabilidade você exporta seus dados (despesas, faturas e mais) em CSV ou JSON para seu contador ou para o QuickBooks.",
      ] },
    ] },
    { id: "equipe", title: "Equipe e permissões", blurb: "Convidar pessoas e decidir o que podem fazer.", articles: [
      { id: "convidar", q: "Como convido um funcionário?", keywords: "convite equipe funcionário gerente", a: [
        "Em Equipe toque em Convidar, informe nome e e-mail, escolha um modelo de permissões e os projetos em que vai trabalhar. Compartilhe o link do convite; ao abri-lo a pessoa cria a conta e entra.",
        "O plano Free permite até 3 funcionários.",
      ] },
      { id: "permissoes", q: "O que cada função pode fazer?", keywords: "owner manager employee permissões modelo", a: [
        "- Proprietário: tudo, inclusive equipe e configurações.",
        "- Gerente: gerencia projetos, compras e clientes.",
        "- Funcionário: vê só os projetos atribuídos, pede materiais e envia recibos. Só pode comprar se o proprietário permitir, com limite de valor.",
        "As permissões podem ser alteradas ou removidas a qualquer momento.",
      ] },
      { id: "desativar", q: "Alguém saiu da empresa, o que faço?", keywords: "desativar remover", a: [
        "Desative a pessoa em Equipe. Ela perde o acesso na hora e o histórico permanece nos seus projetos.",
      ] },
    ] },
    { id: "supply", title: "Fornecedores", blurb: "Responder solicitações e conectar com empreiteiros.", articles: [
      { id: "supply-responder", q: "Sou fornecedor: como respondo a uma solicitação de preço?", keywords: "responder cotação pdf", a: [
        "Abra o link que enviaram (não precisa de conta) ou entre na sua caixa de entrada se tiver conta de fornecedor. Revise a lista, plantas e notas, faça perguntas se algo não estiver claro e envie sua cotação em PDF com número, total, disponibilidade e prazo de entrega.",
        "Você não vê o que o empreiteiro cobra do cliente dele.",
      ] },
      { id: "supply-conectar", q: "Como me conecto com um empreiteiro?", keywords: "código conexão connect", a: [
        "O fornecedor gera um código de uso único (vence em 14 dias) e o entrega ao empreiteiro. Ele o digita em Fornecedores e fica conectado. Você também pode compartilhar o link de cadastro para o empreiteiro criar a conta.",
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
        "Tente fechar e abrir o app de novo ou recarregar a página. Se o problema continuar, conte em Mais → Ajuda e comentários o que estava fazendo e o que viu; a página em que você estava fica registrada.",
      ] },
    ] },
  ],
};
export default pt;
