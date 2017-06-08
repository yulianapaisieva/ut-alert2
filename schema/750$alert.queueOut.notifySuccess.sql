ALTER PROCEDURE [alert].[queueOut.notifySuccess] -- used by port to report success after sending
    @messageId int, -- the ID of the message to report
    @externalId nvarchar(50) = NULL--message id from sms provider
AS
BEGIN TRY
    DECLARE @statusProcessing int = (SELECT id FROM [alert].[status] WHERE [name] = 'PROCESSING')
    DECLARE @statusDelivered int = (SELECT id FROM [alert].[status] WHERE [name] = 'DELIVERED')
    DECLARE @messageStatus int;

    SELECT @messageStatus = [statusId] FROM [alert].[messageOut]
    WHERE [id] = @messageId;

    IF @messageStatus IS NULL
        RAISERROR(N'alert.messageNotExists', 16, 1);

    IF @messageStatus != @statusProcessing AND @messageStatus != @statusDelivered
        RAISERROR(N'alert.messageInvalidStatus', 16, 1);

    SELECT 'updated' resultSetName, 1 single;

    IF @externalId IS NOT NULL
    BEGIN
        UPDATE m
        SET [statusId] = @statusDelivered,
            [timeSent] = GETDATE(),
            [externalId] = @externalId
        OUTPUT INSERTED.id as [messageId], 'DELIVERED' as [status], INSERTED.timeSent, INSERTED.externalId
        FROM [alert].[messageOut] m
        WHERE m.[id] = @messageId;
    END
    ELSE
    BEGIN
        UPDATE m
        SET [statusId] = @statusDelivered,
            [timeSent] = GETDATE()       
        OUTPUT INSERTED.id as [messageId], 'DELIVERED' as [status], INSERTED.timeSent
        FROM [alert].[messageOut] m
        WHERE m.[id] = @messageId;
    END      
END TRY
BEGIN CATCH
DECLARE @CORE_ERROR_FILE_26 sysname='d:\PROJECTS\impl-vfz\node_modules\ut-alert\schema/750$alert.queueOut.notifySuccess.sql' DECLARE @CORE_ERROR_LINE_26 int='27' EXEC [core].[errorStack] @procid=@@PROCID, @file=@CORE_ERROR_FILE_26, @fileLine=@CORE_ERROR_LINE_26, @params = NULL
END CATCH
