ALTER PROCEDURE [alert].[queueIn.push]
    @port varchar(255),
    @channel varchar(128),
    @sender nvarchar(255),
    @content nvarchar(max),
    @priority int = 0,
    @messageInId BIGINT = NULL,
    @meta [core].[metaDataTT] READONLY
AS
BEGIN
    BEGIN TRY
        DECLARE @statusName nvarchar(255) = 'QUEUED'
        DECLARE @statusId int = (select id from [alert].[status] where name = @statusName)

        SELECT 'inserted' resultSetName;

        INSERT INTO [alert].[messageIn](port, channel, sender, content, createdOn, statusId, priority)
        OUTPUT INSERTED.id, INSERTED.port, INSERTED.channel, INSERTED.sender, INSERTED.content, INSERTED.createdOn,
                @statusName as status, INSERTED.priority
        SELECT @port, @channel, @sender, @content, SYSDATETIMEOFFSET(), @statusId, @priority
    END TRY
    BEGIN CATCH
         EXEC [core].[error]
    END CATCH
END
