// Override joi-password types to avoid interface extension issues
declare module 'joi-password' {
  import * as joi from 'joi';
  
  const joiPassword: any;
  export = joiPassword;
}