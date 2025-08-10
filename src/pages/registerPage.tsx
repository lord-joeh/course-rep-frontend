import Register from "../components/auth/Register";

const RegisterPage = () => {
        return(
        <div className='flex flex-col items-center justify-center min-h-screen p-4 gap-5'>
            <h1 className='text-2xl'>Create an Account</h1>
        <Register/>
        </div>
    )
}

export default RegisterPage