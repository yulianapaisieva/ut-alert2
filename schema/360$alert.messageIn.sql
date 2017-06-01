CREATE TABLE [alert].[messageIn] ( -- table that stores all the messages that are generated for send
    [id] bigint IDENTITY(1,1) not null, -- the PK of the table
    [port] varchar(255) not null, -- implementation dependant
    [channel] varchar(100) not null, -- channel is by what the message should be sent, for example "email", "sms"
    [sender] nvarchar(255) not null, -- the number or the email address of the sender
    [content] nvarchar(max) not null,  -- the message content
    [createdOn] datetimeoffset(7) not null, -- when the message is created
    [statusId] tinyint not null, -- the status of the message
    [priority] smallint not null, -- the priority of the message
    [messageOutId] bigint null, -- in/out cross reference
    CONSTRAINT [pk_alert_messageIn_id] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [fk_alert_messageIn_statusId_alert_status_id] FOREIGN KEY ([statusId]) REFERENCES [alert].[status] ([id])
)
