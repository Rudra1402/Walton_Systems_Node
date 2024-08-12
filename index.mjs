import fetch from 'node-fetch';
// My Twilio SendGrid account got locked right after creating it and MailGun's sandbox domain does not allow to send normal emails without upgrading the plan. That's why I went with "NodeMailer" as an alternative!
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

let query = `
  query {
    boards (ids: 7201671060) {
      items_page(limit: 10) {
        cursor
        items {
          id
          name
          column_values {
            id
            text
            value
          }
        }
      }
    }
  }
`;

fetch("https://api.monday.com/v2", {
    method: 'post',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjM5NTUwNDE4MywiYWFpIjoxMSwidWlkIjo2NDYxMjM5MCwiaWFkIjoiMjAyNC0wOC0xMFQyMDo1MDoyOC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MjQ4NjAxNjYsInJnbiI6InVzZTEifQ.E0uN0mds7b2yAYuYAapV9XfElBlD1qFrZeXN5Fk7AIM',
        'API-version': '2023-10'
    },
    body: JSON.stringify({
        query: query
    })
})
    .then(res => res.json())
    .then(res => {
        let tasksArr = res?.data?.boards[0]?.items_page?.items;
        tasksArr.forEach(task => {
            const email = task?.column_values[7]?.text;
            const subject = 'Task Update';
            const text = task?.column_values[8]?.text;
            sendEmail(email, subject, text);
        });
    })
    .catch(error => {
        console.error('Error fetching tasks:', error);
    });

function sendEmail(to, subject, text) {
    const mailOptions = {
        from: `Rudra Patel <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        text: text
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.error('Error sending email:', error);
        }
        console.log('Email sent:', info.response);
    });
}

// Railway Config to deploy script to run every 4 hours Monday-Friday!

// railway:
    // schedules:
        // - name: "Fetch and Email Task Updates"
        // schedule: "0 */4 * * 1-5"
        // command: "node index.mjs"