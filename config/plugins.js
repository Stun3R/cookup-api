module.exports = ({ env }) => ({
  // ...
  email: {
    provider: 'nodemailer',
    providerOptions: {
      host: env('NODEMAILER_HOST'),
      port: env('NODEMAILER_PORT'),
      secure: env('NODEMAILER_SECURE'),
      username: env('NODEMAILER_USERNAME'),
      password: env('NODEMAILER_PASSWORD'),
    },
    settings: {
      defaultFrom: 'contact@cookup.com',
      defaultReplyTo: 'noreply@cookup.com',
    },
  },
  // ...
});
