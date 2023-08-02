const password_reset_template = (link) => {
  return `
            <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Password Reset - TNZ Creations</title>
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
          .button {
            display: inline-block;
            margin-top: 30px;
            margin-bottom: 30px;
            background-color: #feef05;
            color: #000;
            font-weight: bold;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 5px;
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
        <div class="container">
          <div class="header">
            <div class="logo-cont">
              <img
                class="logo"
                src="https://lh3.googleusercontent.com/a/AAcHTtcwBCrfpwznpudToroNPprw-ujPJ9I-Uwvw7LL4V-CXipo=s96-c-rg-br100"
                alt="TNZ Creations Logo"
              />
              <h1>TNZ Creations</h1>
            </div>
            <h3>Password Reset</h3>
          </div>
          <p>Hello,</p>
          <p>
            We received a request to reset your password for your TNZ Creations
            account. Click the button below to proceed with the password reset:
          </p>
          <a class="button" href=${link}
          target='_blank'
            >Reset Password</a
          >
          <p>If you did not request a password reset, please ignore this email.</p>
    
          <hr style="border: none; border-top: 1px solid #eeeeeeb2" />
    
          <div class="footer">
            <p>TNZ Creations</p>
            <p>Okhla, New Delhi, India</p>
            <p style="margin-top: 10px">tnzcreations1@gmail.com</p>
          </div>
        </div>
      </body>
    </html>
    
            `
}

module.exports = password_reset_template
