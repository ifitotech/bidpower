import type { SiteContent } from "./types";
import { helpPt } from "./help-pt";

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
    acceptNote: "Ao criar sua conta você aceita os", helpHere: "Ajuda sobre esta tela", footerRights: "Todos os direitos reservados.", print: "Imprimir", topics: "Temas", related: "Relacionado",
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
        "Quando um cliente aprova uma proposta, o BidPower registra o nome digitado, a data, a hora e o endereço IP. Esse registro não é uma assinatura eletrônica certificada. Se precisar de uma assinatura com validade jurídica especial, use um contrato assinado separadamente.",
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
        "- Quando um cliente responde uma proposta por link: o nome digitado, a data, a hora e o endereço IP.",
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
  help: helpPt,
};
export default pt;
