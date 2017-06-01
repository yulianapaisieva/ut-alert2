IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name='fk_alert_messageIn_Id') BEGIN
    ALTER TABLE [alert].[messageOut]
    ADD CONSTRAINT [fk_alert_messageIn_Id] FOREIGN KEY ([messageInId]) REFERENCES [alert].[messageIn] ([id])
END

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name='fk_alert_messageOut_Id') BEGIN
    ALTER TABLE [alert].[messageIn]
    ADD CONSTRAINT [fk_alert_messageOut_Id] FOREIGN KEY ([messageOutId]) REFERENCES [alert].[messageOut] ([id])
END