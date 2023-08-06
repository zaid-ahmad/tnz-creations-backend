const payment_successful_template = (link) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Payment Successful - TNZ Creations</title>
      <style>
      /* Reset styles */
      body,
      p,
      h1,
      h2,
      h3,
      h4,
      h5,
      h6 {
        margin: 0;
        padding: 0;
      }

      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        background-color: #000;
        color: #fff;
      }

      /* Container styles */
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }

      .logo-cont {
        display: inline;
      }

      /* Logo styles */
      .logo {
        display: block;
        max-width: 100px;
        margin: 0 auto;
      }

      /* Header styles */
      .header {
        text-align: center;
        margin-bottom: 20px;
      }

      .header h1 {
        font-size: 28px;
      }

      .header h3 {
        margin-top: 30px;
      }
  
        /* Button styles */
        .button-container {
          text-align: center;
          margin-top: 30px;
          margin-bottom: 30px;
        }
  
        .button {
          background-color: #4caf50;
          color: #fff;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 5px;
          display: inline-block;
        }
  
        hr {
          margin-top: 20px;
        }
  
        /* Footer styles */
        .footer {
          float: right;
          padding: 8px 0;
          color: #aaa;
          font-size: 0.8em;
          line-height: 1.5;
          font-weight: 300;
        }
  
        .footer p {
          color: #ccc;
        }
      </style>
    </head>
    <body>
      <table class="container" cellspacing="0" cellpadding="0">
        <tr>
          <td>
          <div class="header">
          <div class="logo-cont">
            <img
              class="logo"
              src="https://lh3.googleusercontent.com/a/AAcHTtcwBCrfpwznpudToroNPprw-ujPJ9I-Uwvw7LL4V-CXipo=s96-c-rg-br100"
              alt="TNZ Creations Logo"
            />
            <h1>TNZ Creations</h1>
          </div>
          <h3>Payment Successful</h3>
        </div>
            <p>Hello,</p>
            <p>
              Your payment for TNZ Creations has been successfully processed.
              Thank you for your purchase!
            </p>
            <table class="button-container" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center">
                <a class="button" href=${link}
          target='_blank'
          style="text-decoration: none"
            >View Order Details</a
          >
                </td>
              </tr>
            </table>
            <p>
              If you have any questions or need further assistance, please feel
              free to contact us.
            </p>
  
            <hr style="border: none; border-top: 1px solid #eeeeeeb2" />
  
            <div class="footer">
              <p>TNZ Creations</p>
              <p>Okhla, New Delhi, India</p>
              <p style="margin-top: 10px">tnzcreations1@gmail.com</p>
            </div>
          </td>
        </tr>
      </table>
    </body>
  </html>
  
          `
}

module.exports = payment_successful_template
