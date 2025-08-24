
import { useForm } from 'react-hook-form';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function Login() {
  const { register, handleSubmit, formState: { errors }, setError } = useForm();

  const onSubmit = async ({ email, password }) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setError('root', { message: e.message });
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 420 }}>
      <h1 className="h4 mb-3">Entrar</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="card p-4 shadow-sm">
        <div className="mb-3">
          <label className="form-label">E-mail</label>
          <input className="form-control" type="email" {...register('email', { required: true })} />
          {errors.email && <div className="text-danger small">Informe o e-mail</div>}
        </div>
        <div className="mb-3">
          <label className="form-label">Senha</label>
          <input className="form-control" type="password" {...register('password', { required: true })} />
          {errors.password && <div className="text-danger small">Informe a senha</div>}
        </div>
        {errors.root && <div className="alert alert-danger">{errors.root.message}</div>}
        <button className="btn btn-primary w-100" type="submit">Entrar</button>
      </form>
    </div>
  );
}
