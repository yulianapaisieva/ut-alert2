ALTER PROCEDURE [alert].[queueOut.notifyFailure] -- used by port to report failure on sending
    @messageId int, -- the ID of the message to report
    @errorMessage nvarchar(max), -- the error to report
    @errorCode nvarchar(64) -- the error code to report
AS
BEGIN TRY
    DECLARE @statusProcessing int = (SELECT id FROM [alert].[status] WHERE [name] = 'PROCESSING')
    DECLARE @statusFailed int = (SELECT id FROM [alert].[status] WHERE [name] = 'FAILED')
    DECLARE @messageStatus int;

    SELECT @messageStatus = [statusId] FROM [alert].[messageOut]
    WHERE [id] = @messageId;

    IF @messageStatus IS NULL
        RAISERROR(N'alert.messageNotExists', 16, 1);

    IF @messageStatus != @statusProcessing AND @messageStatus != @statusFailed
        RAISERROR(N'alert.messageInvalidStatus', 16, 1);

    SELECT 'updated' resultSetName, 1 single;

    UPDATE m
    SET [statusId] = @statusFailed,
        [error] = @errorMessage,
        [timeSent] = GETDATE()
    OUTPUT INSERTED.id as [messageId], 'FAILED' as [status], INSERTED.[error], INSERTED.[timeSent]
    FROM [alert].[messageOut] m
    WHERE m.[id] = @messageId;
END TRY
BEGIN CATCH
DECLARE @CORE_ERROR_FILE_28 sysname='d:\PROJECTS\impl-vfz\node_modules\ut-alert\schema/750$alert.queueOut.notifyFailure.sql' DECLARE @CORE_ERROR_LINE_28 int='29' EXEC [core].[errorStack] @procid=@@PROCID, @file=@CORE_ERROR_FILE_28, @fileLine=@CORE_ERROR_LINE_28, @params = NULL
END CATCH
