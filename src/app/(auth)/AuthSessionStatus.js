const AuthSessionStatus = ({ status, className, isError = false, ...props }) => (
    <>
        {status && (
            <div
                className={`${className} font-medium text-sm ${isError ? 'text-red-600' : 'text-green-600'}`}
                {...props}>
                {status}
            </div>
        )}
    </>
)

export default AuthSessionStatus
