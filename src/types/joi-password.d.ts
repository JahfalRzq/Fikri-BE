// Type declaration override for joi-password to fix interface extension issue
declare module 'joi-password' {
  import * as joi from 'joi';
  
  interface JoiPasswordExtended {
    string(): joi.StringSchema & {
      minOfSpecialCharacters(min: number): joi.StringSchema;
      minOfLowercase(min: number): joi.StringSchema;
      minOfUppercase(min: number): joi.StringSchema;
      minOfNumeric(min: number): joi.StringSchema;
      noWhiteSpaces(): joi.StringSchema;
      onlyLatinCharacters(): joi.StringSchema;
    };
    // Add other joi methods as needed
    object: joi.Root['object'];
    array: joi.Root['array'];
    number: joi.Root['number'];
    boolean: joi.Root['boolean'];
    date: joi.Root['date'];
    any: joi.Root['any'];
    alternatives: joi.Root['alternatives'];
    binary: joi.Root['binary'];
    func: joi.Root['func'];
    link: joi.Root['link'];
    symbol: joi.Root['symbol'];
    valid: joi.Root['valid'];
    invalid: joi.Root['invalid'];
    allow: joi.Root['allow'];
    disallow: joi.Root['disallow'];
    when: joi.Root['when'];
    compile: joi.Root['compile'];
    validate: joi.Root['validate'];
    attempt: joi.Root['attempt'];
    assert: joi.Root['assert'];
    cache: joi.Root['cache'];
    defaults: joi.Root['defaults'];
    extend: joi.Root['extend'];
    expression: joi.Root['expression'];
    in: joi.Root['in'];
    ref: joi.Root['ref'];
    reach: joi.Root['reach'];
    types: joi.Root['types'];
    version: joi.Root['version'];
    ValidationError: joi.Root['ValidationError'];
  }
  
  const joiPassword: JoiPasswordExtended;
  export default joiPassword;
}