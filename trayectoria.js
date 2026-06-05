/**
 * Coeficientes del polinomio de quinto orden
 * Condiciones: pos, vel=0 y acel=0 en ti y tf
 *   a0 = xi
 *   a1 = 0,  a2 = 0
 *   a3 =  10(xf-xi)/T³
 *   a4 = -15(xf-xi)/T⁴
 *   a5 =   6(xf-xi)/T⁵
 */
export function coeficientesQuintico(xi, xf, ti, tf) {
  const T  = tf - ti;
  const dx = xf - xi;
  return [
    xi,
    0,
    0,
    10 * dx / (T ** 3),
   -15 * dx / (T ** 4),
     6 * dx / (T ** 5)
  ];
}

export function evalPoli(coef, t, ti) {
  const tau = t - ti;
  return coef[0] + coef[1]*tau   + coef[2]*tau**2
       + coef[3]*tau**3 + coef[4]*tau**4 + coef[5]*tau**5;
}

/**
 * Genera trayectoria completa
 * Retorna { t[], x[], y[], z[] } en cm
 * Usa la convención del robot: x=px, y=pz, z=py
 */
export function generarTrayectoria(xi, yi, zi, xf, yf, zf, ti = 0, tf = 10, T = 0.01) {
  const cx = coeficientesQuintico(xi, xf, ti, tf);
  const cy = coeficientesQuintico(yi, yf, ti, tf);
  const cz = coeficientesQuintico(zi, zf, ti, tf);

  const t = [], x = [], y = [], z = [];
  for (let ts = ti; ts <= tf + 1e-9; ts = Math.round((ts + T) * 10000) / 10000) {
    t.push(parseFloat(ts.toFixed(4)));
    x.push(evalPoli(cx, ts, ti));
    y.push(evalPoli(cy, ts, ti));
    z.push(evalPoli(cz, ts, ti));
  }
  return { t, x, y, z };
}
