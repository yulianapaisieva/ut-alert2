ALTER PROCEDURE [alert].[queueIn.pop] -- returns the specified count of messages ordered by the priority from the biggest to the lowest
    @port nvarchar(255)
AS
BEGIN TRY
    DECLARE @statusQueued int = (Select id FROM [alert].[status] WHERE [name] = 'QUEUED')
    DECLARE @statusProcessing int = (Select id FROM [alert].[status] WHERE [name] = 'PROCESSING')

    SELECT 'messages' resultSetName;

    UPDATE m
    SET [statusId] =  @statusProcessing
    OUTPUT INSERTED.id, INSERTED.port, INSERTED.channel, INSERTED.sender, INSERTED.content
    FROM
    (
        SELECT TOP 1 [id]
        FROM [alert].[messageIn] m
        WHERE m.[port] = @port AND m.[statusId] = @statusQueued
        ORDER BY m.[priority] DESC
    ) s
    JOIN [alert].[messageIn] m on s.Id = m.id
END TRY
BEGIN CATCH
    EXEC core.error
END CATCH
