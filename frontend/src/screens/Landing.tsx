import { useNavigate } from "react-router-dom"
import { Button } from "../components/Button";
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from "../hooks/useAuth";

export const Landing = () => {
    const navigate = useNavigate();
    const { isAuthenticated, loading, user, handleGoogleLogin } = useAuth();

    if (loading) {
        return <div className="flex justify-center items-center h-screen">
            <div className="text-white">Loading...</div>
        </div>;
    }

    return <div className="flex justify-center">
        <div className="pt-8 max-w-screen-lg">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex justify-center">
                    <img src="./chessboard.jpeg" className="max-w-96" />
                </div>
                <div className="pt-16">
                    <div className="flex justify-center">
                        <h1 className="text-4xl font-bold text-white">Play chess online on the #3 Site!</h1>
                    </div>
                    <div className="mt-8 flex justify-center">
                        {isAuthenticated ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="text-white">Welcome, {user?.name}</div>
                                <Button onClick={() => navigate("/game")}>
                                    Play Online
                                </Button>
                            </div>
                        ) : (
                            <GoogleLogin
                                onSuccess={credentialResponse => {
                                    handleGoogleLogin(credentialResponse.credential || "");
                                }}
                                onError={() => {
                                    console.log('Login Failed');
                                }}
                                useOneTap
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
}
