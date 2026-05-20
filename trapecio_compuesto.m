clc;
clear;
close all;

disp('====================================');
disp(' METODO DEL TRAPECIO COMPUESTO ');
disp(' CALCULO DE VOLUMEN DE AGUA ');
disp('====================================');

% Cantidad de datos
n = input('Ingrese la cantidad de datos: ');

% Crear vectores vacíos
tiempo = zeros(1,n);
caudal = zeros(1,n);

% Ingreso intercalado de datos
disp(' ');
disp('Ingrese los datos de tiempo y caudal');

for i = 1:n
    
    fprintf('\nDato %d\n', i);
    
    tiempo(i) = input(['Tiempo ', num2str(i), ' (min): ']);
    caudal(i) = input(['Caudal ', num2str(i), ' (m^3/s): ']);

end

% Validación de intervalos iguales
h = tiempo(2) - tiempo(1);

for i = 2:n-1
    if (tiempo(i+1) - tiempo(i)) ~= h
        error('ERROR: Los intervalos de tiempo deben ser iguales');
    end
end

% Método del trapecio compuesto
suma_interna = sum(caudal(2:n-1));

integral_aprox = (h/2) * (caudal(1) + 2*suma_interna + caudal(n));

% Conversión de minutos a segundos
volumen_total = integral_aprox * 60;

% Resultados
disp(' ');
disp('========== RESULTADOS ==========');

fprintf('Ancho del intervalo h = %.2f min\n', h);
fprintf('Numero de intervalos = %d\n', n-1);
fprintf('Integral aproximada = %.2f m^3/min\n', integral_aprox);
fprintf('Volumen total = %.2f m^3\n', volumen_total);

% Mostrar tabla
disp(' ');
disp('Datos ingresados:');

for i = 1:n
    fprintf('Tiempo: %.2f min   |   Caudal: %.2f m^3/s\n', tiempo(i), caudal(i));
end

% Gráfica
figure;
plot(tiempo, caudal, '-o', 'LineWidth', 2);

xlabel('Tiempo (min)');
ylabel('Caudal (m^3/s)');
title('Caudal vs Tiempo');
grid on;