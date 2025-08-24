import { useForm } from 'react-hook-form';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function Login() {
  const { register, handleSubmit, formState: { errors }, setError } = useForm();

  const onSubmit = async ({ email, password }) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      // Tenta extrair a mensagem do backend REST:
      let serverMsg;
      try {
        // Alguns erros vêm em e.customData._serverResponse (string JSON)
        const raw = e?.customData?._serverResponse;
        if (raw) serverMsg = JSON.parse(raw)?.error?.message;
      } catch {}

      const map = {
        'auth/invalid-email': 'E-mail inválido.',
        'auth/user-disabled': 'Usuário desabilitado.',
        'auth/user-not-found': 'Usuário não encontrado.',
        'auth/wrong-password': 'Senha incorreta.',
        'EMAIL_NOT_FOUND': 'Usuário não encontrado.',
        'INVALID_PASSWORD': 'Senha incorreta.',
        'OPERATION_NOT_ALLOWED': 'Login por e-mail/senha não está habilitado no Firebase.',
        'INVALID_EMAIL': 'E-mail inválido.',
        'USER_DISABLED': 'Usuário desabilitado.',
      };
      const key = serverMsg || e.code || e.message;
      const msg = map[key] || 'Falha no login. Verifique e-mail/senha.';
      setError('root', { message: msg });
      // Para diagnóstico local:
      console.warn('[Auth] erro no login:', { code: e.code, serverMsg, raw: e });
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
          <input className="form-control" type="password" {...register('password', { required: true, minLength: 6 })} />
          {errors.password && <div className="text-danger small">Informe a senha (mín. 6 chars)</div>}
        </div>
        {errors.root && <div className="alert alert-danger">{errors.root.message}</div>}
        <button className="btn btn-primary w-100" type="submit">Entrar</button>
      </form>
    </div>
  );
}
