'use strict'

/**
 * Module dependencies
 */

// Public node modules.
const _ = require('lodash')
const nodemailer = require('nodemailer')
const nodemailerNTLMAuth = require('nodemailer-ntlm-auth')

/**
 * Converts a string to a bool.
 *  - match 'true', 'on', or '1' as true.
 *  - ignore all white-space padding
 *  - ignore capitalization (case).
 **/
const toBool = (val) => /^\s*(true|1|on)\s*$/i.test(val)

/* eslint-disable no-unused-vars */
module.exports = {
  init: (providerOptions = {}, settings = {}) => {
    let transporter

    if (providerOptions.authMethod === 'ntlm') {
      transporter = nodemailer.createTransport({
        host: providerOptions.host,
        port: providerOptions.port,
        secure: toBool(providerOptions.secure),
        auth: {
          type: 'custom',
          method: 'NTLM',
          user: providerOptions.username,
          pass: providerOptions.password,
        },
        customAuth: {
          NTLM: nodemailerNTLMAuth,
        },
      })
    } else {
      transporter = nodemailer.createTransport({
        host: providerOptions.host,
        port: providerOptions.port,
        secure: toBool(providerOptions.secure),
        auth: {
          user: providerOptions.username,
          pass: providerOptions.password,
        },
      })
    }

    return {
      send: (options) => {
        console.log(options)
        return new Promise((resolve, reject) => {
          // Default values.
          options = _.isObject(options) ? options : {}
          options.from = options.from || settings.defaultFrom
          options.replyTo = options.replyTo || settings.defaultReplyTo
          options.text = options.text || options.html
          options.html = options.html || options.text

          const msg = [
            'from',
            'to',
            'cc',
            'bcc',
            'subject',
            'text',
            'html',
            'attachments',
          ]

          transporter
            .sendMail(_.pick(options, msg))
            .then(resolve)
            .catch((error) => reject(error))
        })
      },
    }
  },
}
