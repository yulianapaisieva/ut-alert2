ALTER PROCEDURE [alert].[queueOut.push]
    @port varchar(255),
    @channel varchar(128),
    @recipient [core].[arrayList] READONLY,
    @content nvarchar(max),
    @priority int = 0,
    @messageInId BIGINT = NULL,
    @meta [core].[metaDataTT] READONLY,
    @languageOnSent varchar(5) = NULL,
    @smsProvider varchar(50) = NULL
AS
BEGIN
    BEGIN TRY
        DECLARE @statusName nvarchar(255) = 'QUEUED'
        DECLARE @statusId int = (select id from [alert].[status] where name = @statusName)
        DECLARE @actorId bigint = (select [auth.actorId] from @meta)

        IF @actorId IS NULL
            RAISERROR(N'alert.missingCreatorId', 16, 1);

        SELECT 'inserted' resultSetName;

        INSERT INTO [alert].[messageOut](port, channel, recipient, content, createdBy, createdOn, statusId, priority, messageInId,language,smsProvider)
        OUTPUT INSERTED.id, INSERTED.port, INSERTED.channel, INSERTED.recipient, INSERTED.content, INSERTED.createdBy, INSERTED.createdOn,
                @statusName as status, INSERTED.priority, INSERTED.messageInId, INSERTED.language,INSERTED.smsProvider
        SELECT @port, @channel, LTRIM(RTRIM([value])), @content, @actorId, SYSDATETIMEOFFSET(), @statusId, @priority, @messageInId,@languageOnSent,@smsProvider
        FROM @recipient
    END TRY
    BEGIN CATCH
         EXEC [core].[error]
    END CATCH
END
