
import ResetPassword from '../../components/auth/ResetPassword'

const ResetPasswordPage = () => {
        return(
        <div className='flex flex-col items-center justify-center min-h-screen p-4 gap-5'>
            <h1 className='text-2xl'>Reset Password</h1>
        <ResetPassword/>
        </div>
    )
}

export default ResetPasswordPage