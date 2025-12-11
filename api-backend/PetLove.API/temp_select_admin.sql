USE PetLove;
SELECT Id, Correo, Clave, Activo, IdRol, LEN(Clave) AS LenClave, DATALENGTH(Clave) AS DataLenClave
FROM Usuarios WHERE Correo='admin@petlove.com';