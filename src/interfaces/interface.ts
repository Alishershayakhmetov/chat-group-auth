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