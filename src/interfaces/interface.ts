import { Request } from "express";

export interface RegisterData {
    email: string;
    hashedPassword: string;
    name?: string;
    lastName?: string;
}
  
export interface UserPayload {
    id: string;
    email: string;
}


export interface User {
    id: string,
    iat: number,
    exp: number
}

export interface CustomRequest extends Request {
    user: User;
}