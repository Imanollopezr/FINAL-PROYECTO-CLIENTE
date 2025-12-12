IF NOT EXISTS (SELECT 1 FROM [dbo].[__EFMigrationsHistory] WHERE [MigrationId] = '20251007051049_AddPorcentajeGananciaPrecision')
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES ('20251007051049_AddPorcentajeGananciaPrecision', '9.0.9');
END