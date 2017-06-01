IF NOT EXISTS( SELECT 1 FROM sys.columns WHERE Name = N'timeSent' AND Object_ID = Object_ID(N'alert.messageOut') ) 
BEGIN
	ALTER TABLE [alert].[messageOut] ADD timeSent datetimeoffset(7) NULL
END

IF NOT EXISTS( SELECT 1 FROM sys.columns WHERE Name = N'language' AND Object_ID = Object_ID(N'alert.messageOut') ) 
BEGIN
	ALTER TABLE [alert].[messageOut] ADD language varchar(5)  NULL
END

IF NOT EXISTS( SELECT 1 FROM sys.columns WHERE Name = N'smsProvider' AND Object_ID = Object_ID(N'alert.messageOut') ) 
BEGIN
	ALTER TABLE [alert].[messageOut] ADD smsProvider varchar(50) NULL
END

IF NOT EXISTS( SELECT 1 FROM sys.columns WHERE Name = N'error' AND Object_ID = Object_ID(N'alert.messageOut') ) 
BEGIN
	ALTER TABLE [alert].[messageOut] ADD error nvarchar(max) NULL
END

IF NOT EXISTS( SELECT 1 FROM sys.columns WHERE Name = N'externalId' AND Object_ID = Object_ID(N'alert.messageOut') ) 
BEGIN
	ALTER TABLE [alert].[messageOut] ADD externalId nvarchar(50) NULL
END
