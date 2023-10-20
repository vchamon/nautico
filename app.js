const axios = require('axios')
const qs = require('qs')

// Número da cota
const QUOTA_NUMBER = '3505'
// Senha da cota (Geralmente é composta pelos 4 primeiros dígitos do CPF + os os 2 primeiros dígitos da data de nascimento)
const PASSWORD = '130605'

// Dia que deseja reservar. Ex: 05
const DAY = '03'
// Mês que deseja reservar. Ex: 09
const MONTH = '11'
// Ano que deseja reservar. Ex: 2023
const YEAR = '2023'

// Intervalo entre tentativar de reserva em segundos. Ex: 1
const INTERVAL_BETWEEN_ATTEMPTS_IN_SECONDS = 2

async function main() {
  const is = await getIs()

  console.log(`ID: ${is}`)

  const config = {
    method: 'get',
    url: `http://sociocnsl.ddns.net:8080/qualityweb.exe?page=reservas&is=${is}`
  }

  await axios(config)

  let response = await doSchedule(is)

  const sleepTime = INTERVAL_BETWEEN_ATTEMPTS_IN_SECONDS * 1000

  while (response.includes('Local não encontrado')) {
    console.log(`Local indisponível, tentando novamente em ${INTERVAL_BETWEEN_ATTEMPTS_IN_SECONDS} segundo(s).`)
    await sleep(sleepTime)
    response = await doSchedule(is)
  }

  if (response.includes('Local indisponível')) {
    console.log('Local já reservado por outro sócio.')
  } else {
    console.log('Local agendado com sucesso.')
  }
}

async function getIs() {
  const data = {
    'is': '000001',
    'page': 'principal',
    'tiplog': 'titulo',
    'numcat': '1',
    'numcad': QUOTA_NUMBER,
    'senha': PASSWORD,
    'cpf': '',
    'codcli': ''
  }
  
  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'http://sociocnsl.ddns.net:8080/qualityweb.exe',
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: qs.stringify(data)
  }

  const is = await axios(config)
    .then(({ data: html }) => {
      const regex = /<input.*\"is\".*value=\"(\d+)\"/
      const match = html.match(regex)

      return match[1]
    })

  await axios({
    method: 'get',
    url: 'http://sociocnsl.ddns.net:8080/'
  })

  data.is = is
  config.data = qs.stringify(data)

  await axios(config)

  return is
}

function doSchedule(is) {
  const date = `${YEAR}${MONTH}${DAY}`

  const config = {
    method: 'get',
    url: `http://sociocnsl.ddns.net:8080/qualityweb.exe?page=gravar_reserva&is=${is}&dep=&idReserva=${date}000200010000`
  }

  return axios(config).then(({ data }) => data)
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

main()
