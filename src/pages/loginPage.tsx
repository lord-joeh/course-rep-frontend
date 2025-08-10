import Login from '../components/auth/Login'
const LoginPage = () => {
    return(
        <div className='flex flex-col items-center justify-center min-h-screen  p-4 gap-5'>
            <h1 className='text-2xl'>Login to Your Account</h1>
        <Login/>
        </div>
    )
}

export default LoginPage