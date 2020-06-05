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
    SELECT MAX(pm10_0) AS dust, MAX(pm2_5) AS ultrafine, rgst_dt 
    FROM finedust_tb 
    GROUP BY SUBSTR(rgst_dt, 1, 13) 
    ORDER BY rgst_dt DESC LIMIT 30
  `;

  connection.query(query, (err, rows, fields) => {
    if (!err) {
      res.render('content/info', {'datas': rows.map(data => {
                                            return {
                                              dust: data.dust,
                                              dustStatus: getDustStatus(data.dust),
                                              ultrafine: data.ultrafine,
                                              ultrafineStatus: getUltraFineDustStatus(data.ultrafine),
                                              rgst_dt: moment(data.rgst_dt).format('MM-DD:hh')
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
  const start = moment(`${params.startDate}T${params.startTime}:00:00+00:00`).format('YYYY-MM-DD hh:mm:ss');
  const end = moment(`${params.endDate}T${params.endTime}:00:00+00:00`).format('YYYY-MM-DD hh:mm:ss');
  
  const query = `
    SELECT MAX(pm10_0) AS dust, MAX(pm2_5) AS ultrafine, rgst_dt 
    FROM finedust_tb WHERE rgst_dt >= '${start}' AND rgst_dt <= '${end}' 
    GROUP BY SUBSTR(rgst_dt, 1, ${params.time}) 
    ORDER BY rgst_dt DESC 
    LIMIT 30
  `;

  connection.query(query, (err, rows, fields) => {
    if (!err) {
      let result;

      rows.forEach(data => {
        const html = `
          <tr>
            <td>${moment(data.rgst_dt).format(params.time === '13' ? 'MM-DD:hh' : 'MM-DD')}</td>
            <td class="${getDustStatus(data.dust)}">●</td>
            <td>${data.dust}</td>
            <td class="${getUltraFineDustStatus(data.ultrafine)}">●</td>
            <td>${data.ultrafine}</td>
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

module.exports = router;
