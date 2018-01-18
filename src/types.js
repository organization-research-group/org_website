"use strict";

const Type = require('union-type')

exports.CSLField = Type({ CSLField: {
  cslKey: String,
  subject: String,
  predicate: String,
  required: Boolean,
}})
