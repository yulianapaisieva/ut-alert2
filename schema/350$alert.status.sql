CREATE TABLE [alert].[status] ( -- table that stores the statuses of the meassages
    [id] tinyint IDENTITY(1,1) not null, -- the PK of the status
    [name] nvarchar(64) not null, -- the name of the status
    CONSTRAINT [pk_alert_status_id] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [uq_alert_status_name] UNIQUE ([name])
)
