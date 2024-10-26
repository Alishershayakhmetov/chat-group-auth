import { Request } from "express";

export interface TempRegisterData {
    email: string;
    password: string;
    fullName?: string
}

export interface RegisterData {
    email: string;
    password: string;
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