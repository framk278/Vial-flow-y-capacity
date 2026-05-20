clc
clear
close all

disp('ANALISIS DE FLUJO VEHICULAR')
disp('DERIVADA CENTRAL')

horas = [6 7 8 9 10 11 12];
n = length(horas);

vehiculos = zeros(1,n);

for i = 1:n
    texto = ['Ingrese vehiculos a las ', num2str(horas(i)), ':00 : '];
    vehiculos(i) = input(texto);
end

h = 1;
derivada = zeros(1,n);

for i = 2:n-1
    derivada(i) = (vehiculos(i+1)-vehiculos(i-1))/(2*h);
end

disp('RESULTADOS')

for i = 2:n-1
    fprintf('Hora %d:00\n', horas(i))
    fprintf('Tasa de cambio: %.2f veh/hora\n', derivada(i))

    if derivada(i) > 40
        disp('Congestion critica')
    else
        if derivada(i) > 15
            disp('Incremento moderado')
        else
            disp('Flujo estable')
        end
    end
end

figure
plot(horas, vehiculos, '-o')
grid on
title('Flujo vehicular')

figure
plot(horas, derivada, '-*')
grid on
title('Derivada central')