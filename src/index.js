const venom = require('venom-bot');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid')
const resetFirstMessage = require('./functions/resetFirstMessagesSent');
const userUniqueIds = {};

function generateNewUniqueId(userId) {
  userUniqueIds[userId] = uuidv4();
}


venom 
  .create({
    session: 'Uork'
  })
  .then((client) => start(client))
  .catch((error) => {
    console.log(error);
  });

const initialGreeting = {};
let waitingForResponse = {};
let firstMessagesSent = {};
let messagesAfterAccepted = [];
let lastSentMessage = '';


function start(client) {
  client.onMessage(async (message) => {
    const userId = message.from;
    if (!userUniqueIds[userId]) {
        generateNewUniqueId(userId);
      }
      function sendMessagesToEndpoint(message,senderNameEndpoint) {
        if (accepted) {
          axios.post('https://uork.org/Mail/Whatsapp/send_message.php', {
              sender: senderNameEndpoint.pushname,
              message: message, 
              chat_id: userUniqueIds[userId]
            })
            .then((response) => {
              console.log('Parameterers [MESSAGE]:', message);
              console.log('Parameterers [NAME]:', senderNameEndpoint.pushname);
            })
            .catch((error) => {
              console.error('Erro ao enviar mensagem:', error);
            });
        } else {
          console.log('Pedido ainda não foi aceito');
        }
      }
      
    if (message.isGroupMsg === false) {
      const text = message.body.trim();
      const senderName = await client.getContact(message.from);
     if(messagesAfterAccepted.includes(message.from)) {
      console.log(`Mensagem recebida: ${text} `);
      sendMessagesToEndpoint(text, senderName);
     }
      switch (text.toLowerCase()) {
        case 'iniciar':
          initialGreeting[message.from] = true;
          waitingForResponse[message.from] = true;
          client.sendText(message.from, `😉 ${senderName.pushname}, aqui estão as opções disponíveis: \n\n1️⃣. Saber o status da minha conta\n2️⃣. Conversar com um atendente ao-vivo\n3️⃣. Informações sobre o aplicativo`);
          setTimeout(() => {
            if (waitingForResponse[message.from]) {
              client.sendText(message.from, `🤔 Alô? Tem alguém aí? Nosso atendimento foi encerrado.`);
              delete waitingForResponse[message.from];
            }
          }, 300000); 
          break;
        case '1':
          waitingForResponse[message.from] = false;
          if (initialGreeting[message.from]) {
            client.sendText(message.from, `🔍 | Procurando...`);
            delete waitingForResponse[message.from];
            let phoneNumber = message.from.replace('@c.us', '').slice(2);
            phoneNumber = `${phoneNumber.substring(0, 2)}9${phoneNumber.substring(2)}`; 
            client.sendText(message.from, `Veja o que encontrei pesquisando pelo seu número de telefone: *${phoneNumber}*`);
            const url = `https://uork.org/search/status/check-account.php?apikey=UORK_KEYfqQ7XDiYG81rQFD2Dhu81KhbVd&id=${phoneNumber}`;
            fetch(url)
              .then((response) => response.json())
              .then((data) => {
                const { nome, email, id, uorkv } = data;
              
                let possuiUorkV = uorkv ? 'Possui Uork-V' : 'Não possui Uork-V';
              
                const aboutPerson = `👤 Sobre ${nome} \n\n📧 E-mail: ${email}\n🆔 ID: ${id}\n🟢 Situação: Ativa\nℹ️ ${possuiUorkV}`;
              
                client.sendText(message.from, aboutPerson);
              })      
              .catch((error) => {
                client.sendText(message.from, `❌ | Houve um erro ao consultar a conta.`);
                console.error('Erro na consulta da conta:', error);
              });
          } else {
            client.sendText(message.from, `❌ | Por favor, inicie a conversa com 'iniciar' para ter acesso às opções.`);
          }
          break;
          case '2':
            waitingForResponse[message.from] = false;
    if (initialGreeting[message.from]) {
        const currentTime = new Date().getHours();

        if (currentTime >= 20) {
            client.sendText(message.from, `${senderName.pushname}, aguarde, vou chamar um atendente pra você! 🙂`);
            setTimeout(() => {
                client.sendText(message.from, `Nosso atendimento encerrou por hoje. Por favor, contate-nos pelo sistema de suporte: https://uork.org/suporte.`);
            }, 4000);
        } else {
          const dataToSend = {
              id: userUniqueIds[userId], 
              senderName: senderName.pushname
          };
          client.sendText(message.from, `${senderName.pushname}, aguarde, vou chamar um atendente pra você! 🙂`);
            axios.get('https://uork.org/Mail/Whatsapp', { params: dataToSend })
                .then((response) => {
        
                  setTimeout(() => {
                      client.sendText(message.from, `Enviei a sua *solicitação* para nossos atendentes, já anunciei sua presença, e em breve alguém irá te atender!`);
                  }, 4000);
                  setTimeout(() => {
                    client.sendText(message.from, `ID da sua solicitação: *${dataToSend.id}*`);
                }, 6000);
                  setTimeout(() => {
                    client.sendText(message.from, `⏳ Tempo estimado: \n\n *3-6 minutos.*`);
                    checkStatus(dataToSend.id, message.from, 50); 
                }, 8000);
                    console.log('GET enviado');

                })
                .catch((error) => {
                    console.error('Erro ao encaminhar mensagem:', error);
                });

            delete waitingForResponse[message.from];
        }
    } else {
        client.sendText(message.from, `❌ | Por favor, inicie a conversa com *'iniciar'* para ter acesso às opções.`);
    }
    break;
  
    function checkLastMessage(uniqueID, atendente) {
      axios.get(`https://uork.org/Mail/Whatsapp/search_last_message.php?id=${uniqueID}`)
        .then((response) => {
          const lastMessage = response.data;
    
          if (lastMessage !== "FINISHED_SERVICE_UORK_HTTP") {
            if (lastMessage !== "ANY_MESSAGE_FOUND") {
              if (lastMessage !== lastSentMessage) { 
                client.sendText(message.from, lastMessage);
                lastSentMessage = lastMessage; 
              } else {
              }
            } else {
            }
            setTimeout(() => {
              checkLastMessage(uniqueID, atendente);
            }, 2000);
          } else {
            client.sendText(message.from, `📝💙 Atendimento finalizado!\n\nEsperamos que tenha resolvido seu problema!\n\n🤔Nos conte, o que achou do atendimento de *${atendente}?*\nSe puder, envie em: https://uork.org/suporte\nAté mais!\n\n*#UorkSãoInfinitasPossibilidades*`);
            delete  messagesAfterAccepted.push(message.from);
            generateNewUniqueId(message.from);
            delete firstMessagesSent[message.from];
            initialGreeting[message.from] = false;
     }
        })
        .catch((error) => {
          console.error('Erro ao verificar última mensagem:', error);
        });
    }
    function checkStatus(requestId, recipient, attempts) {
    
        axios.get(`https://uork.org/Mail/Whatsapp/check-status.php?id=${requestId}`)
        .then((response) => {
          const status = response.data.status;
          const atendente = response.data.atendente;
    
          if (status === 'pendente' && attempts > 0) {
            setTimeout(() => {
              checkStatus(requestId, recipient, attempts - 1);
            }, 10000);
          } else if (status === 'pendente' && attempts === 0) {
            client.sendText(recipient, `Pedimos mil desculpas por isso, mas nosso atendimento está sobrecarregado, tente novamente mais tarde.\n\nCaso ainda queira contatar um de nossos atendentes, entre pelo link:\nhttps://uork.org/suporte`);
            delete initialGreeting[message.from];
            generateNewUniqueId(message.from); 
          } else if (status === 'recusado') {
            client.sendText(recipient, `Nenhum administrador aceitou seu pedido. Pedimos desculpa por isso.\n\nTente novamente mais tarde.\n\nCaso ainda queira contatar um de nossos atendentes, entre pelo link:\nhttps://uork.org/suporte`);
            generateNewUniqueId(message.from); 
            delete initialGreeting[message.from];
          } else if (status === 'aceito') {
            accepted = true;
            client.sendText(recipient, `➡ Seu pedido foi aceito! Um atendente entrou na linha.`);
            setTimeout(() => {
              client.sendText(message.from, `👋💙 Olá, ${senderName.pushname}, tudo bem?\nMeu nome é *${atendente}* e é um prazer atender você.\n\nComo posso te auxiliar hoje? 🤔`);
            }, 2000);
          
            messagesAfterAccepted.push(message.from);
        
            checkLastMessage(userUniqueIds[userId], atendente);
          }
        })
        .catch((error) => {
          console.error('Erro ao verificar status:', error);
        });
    }
    
       case '3':
        waitingForResponse[message.from] = false;
        if (initialGreeting[message.from]) {
          delete waitingForResponse[message.from];
          client.sendText(message.from, `Claro! Vou te enviar *informações* sobre nosso aplicativo, só um instante... 🙂`)
          setTimeout(() => {
            client.sendText(message.from, `Bom, consegui encontrar as seguintes informações que podem te ajudar, ${senderName.pushname}! 😄 `);
            client.sendText(message.from, `\n\n📸Instagram: https://instagram.com/uorkapp\n\n❓Suporte: https://uork.org/suporte\n\n⬇Aplicativo: https://app.uork.org\n\n📝Termos e conduta: https://uork.org/terms.html `)
           }, 2000)
        } else {
          client.sendText(message.from, `❌ | Por favor, inicie a conversa com 'iniciar' para ter acesso às opções.`);
        }
        default:
          if (!initialGreeting[message.from]) { 
            
          if(!firstMessagesSent[message.from]){
            resetFirstMessage;
            firstMessagesSent[message.from] = true;
            client.sendText(message.from, `Olá, ${senderName.pushname}! 😊`)
            setTimeout(() => {
              client.sendText(message.from, `Sou o atendente virtual da Uork! 🤖 `)
             }, 2000);
            setTimeout(() => {
             client.sendText(message.from, `É um prazer poder falar com você, como podemos ajudar? 🤔`)
            }, 2500);
            setTimeout(() => {
              client.sendText(message.from, `Digite *iniciar* para que eu possa te enviar um catálogo com as opções disponíveis.`)
             }, 4000);
            } else {
              client.sendText(message.from, `🤔 | Desculpe, eu não entendi. Veja o catálogo de opções de atendimento digitando *iniciar*.`);
            }
           

          }
        
        
      }
    }
  });
}
