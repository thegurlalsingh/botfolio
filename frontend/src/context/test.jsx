import React, { useEffect, useState } from "react";
import axios from "axios"; 

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const[loading, setLoading] = useState(null);
}

const backend_url = import.meta.env.VITE_BACKEND_URL;

axios.defaults.baseURL = `${backend_url}/api`;

useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if(storedToken){
        setToken(storedToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        try{
            const payload = JSON.parse(atob(storedToken.split('.')[1]));
            setUser({
                id: payload.id,
                name: payload.name,
                email: payload.name,
                currentStep: payload.currentStep
            });
        }
        catch (e) {
            localStorage.removeItem('token');
        }
        setLoading(false);
    }
}, []);

