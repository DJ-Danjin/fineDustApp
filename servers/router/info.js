const express = require('express');
const router = express.Router();
const moment = require('moment');
const connection = require("../connection");

const getDustStatus = (value) => {
  if (value <= 30) {
    return 'blue'
  } 
  else if (value > 30 && value <= 80) {
    return 'green'
  }
  else if (value > 80 && value <= 150) {
    return 'yellow'
  }
  else if (value > 150 && value <= 600) {
    return 'red'
  }
  else {
    return 'blue'
  }
}

const getUltraFineDustStatus = (value) => {
  if (value <= 15) {
    return 'blue'
  } 
  else if (value > 15 && value <= 35) {
    return 'green'
  }
  else if (value > 35 && value <= 75) {
    return 'yellow'
  }
  else if (value > 75 && value <= 500) {
    return 'red'
  }
  else {
    return 'blue'
  }
}

/* GET info page. */
router.get('/', (req, res, next) => {
  const query = `
    SELECT MAX(pm10_0) AS dust, 
           MAX(pm2_5) AS ultrafine, 
           AVG(windDirection) AS windDirection, 
           ROUND(AVG(substr(windSpeed, 1, 3)), 2) AS windSpeed, 
           ROUND(AVG(temperature), 1) As temperature,
           ROUND(AVG(humidity), 1) AS humidity,
           rgst_dt 
    FROM finedust_tb 
    GROUP BY SUBSTR(rgst_dt, 1, 13) 
    ORDER BY rgst_dt DESC
    LIMIT 30
  `;

  connection.query(query, (err, rows, fields) => {
    if (!err) {
      res.render('content/info', {'datas': rows.map(data => {
                                            return {
                                              dust: data.dust,
                                              dustStatus: getDustStatus(data.dust),
                                              ultrafine: data.ultrafine,
                                              ultrafineStatus: getUltraFineDustStatus(data.ultrafine),
                                              windDirection: data.windDirection,
                                              windSpeed: data.windSpeed,
                                              temperature: data.temperature,
                                              humidity: data.humidity,
                                              rgst_dt: moment(data.rgst_dt).format('MM-DD : HH')
                                            }
                                          })
                                  });
    }
    else {
      console.log(err);
      res.render('content/info', err);
    }
  })
})

router.get('/api/search', (req, res, next) => {
  const params = req.query;
  const start = `${params.startDate} ${params.startTime}:00:00`;
  const end = `${params.endDate} ${params.endTime}:00:00`;
  
  const query = `
    SELECT MAX(pm10_0) AS dust, 
           MAX(pm2_5) AS ultrafine, 
           AVG(windDirection) AS windDirection, 
           ROUND(AVG(substr(windSpeed, 1, 3)), 2) AS windSpeed, 
           ROUND(AVG(temperature), 1) As temperature,
           ROUND(AVG(humidity), 1) AS humidity,
           rgst_dt 
    FROM finedust_tb WHERE rgst_dt >= '${start}' AND rgst_dt <= '${end}' 
    GROUP BY SUBSTR(rgst_dt, 1, ${params.time}) 
    ORDER BY rgst_dt DESC
    LIMIT 30
  `;

  connection.query(query, (err, rows, fields) => {
    if (!err) {
      let result;
      const dateFormat = {'13': 'MM-DD : HH', '10': 'MM-DD', '18': 'MM-DD HH:mm:ss'};

      rows.forEach(data => {
        const html = `
          <tr>
            <td>${moment(data.rgst_dt).format(dateFormat[params.time])}</td>
            <td class="${getDustStatus(data.dust)}">●</td>
            <td>${data.dust}</td>
            <td class="${getUltraFineDustStatus(data.ultrafine)}">●</td>
            <td>${data.ultrafine}</td>
            <td>
              <img class="wind-direction-icon" src="images/arrow-icon.png" alt="wind-direction" style="width: 40px; transform: rotate(${data.windDirection}deg);" />
            </td>
            <td>${data.windSpeed} (m/s)</td>
            <td>${data.temperature} °C</td>
            <td>${data.humidity} %</td>
          </tr>
        `
        result += html;
      });

      res.send(result);
    }
    else {
      console.log(err);
      res.send(err);
    }
  })
})

router.get('/api/searchforCount', (req, res, next) => {
  const params = req.query;
  const start = `${params.startDate} ${params.startTime}:00:00`;
  const end = `${params.endDate} ${params.endTime}:00:00`;
  
  const query = `
    SELECT pm10_0 AS pm100,
            pm2_5 AS pm25,
            rgst_dt
    FROM finedust_tb
    WHERE rgst_dt >= '${start}' AND rgst_dt <= '${end}'
    ORDER BY rgst_dt DESC
  `;

  connection.query(query, (err, rows, fields) => {
    if (!err) {
      let result;
      let goodCount = 0, normalCount = 0, badCount = 0, veryBadCount = 0;

      rows.forEach(data => {
        if (`${data.pm100}` <= 30) {
          goodCount++;
        } else if (`${data.pm100}` > 30 && `${data.pm100}` <= 80) {
          normalCount++;
        } else if (`${data.pm100}` > 80 && `${data.pm100}` <= 150) {
          badCount++;
        } else if (`${data.pm100}` > 150 && `${data.pm100}` <= 600) {
          veryBadCount++;
        }

        if (`${data.pm25}` <= 15) {
          goodCount++;
        } else if (`${data.pm25}` > 15 && `${data.pm25}` <= 35) {
          normalCount++;
        } else if (`${data.pm25}` > 35 && `${data.pm25}` <= 75) {
          badCount++;
        } else if (`${data.pm25}` > 75 && `${data.pm25}` <= 500) {
          veryBadCount++;
        }
      });

      result = `
        <li>
          <p id="goodDust"> 좋음 : <span id="goodCount">${goodCount}</span>회</p>
        </li>
        <li>
          <p id="normalDust"> 보통 : <span id="normalCount">${normalCount}</span>회</p>
        </li>
        <li>
          <p id="badDust"> 나쁨 : <span id="badCount">${badCount}</span>회</p>
        </li>
        <li>
          <p id="veryBadDust"> 매우나쁨 : <span id="veryBadCount">${veryBadCount}</span>회</p>
        </li>
      `

      res.send(result);
    }
    else {
      console.log(err);
      res.send(err);
    }
  })
})

module.exports = router;