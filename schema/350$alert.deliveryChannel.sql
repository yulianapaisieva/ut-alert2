CREATE TABLE [alert].[deliveryChannel] ( -- List of supported deliver channels by ut-alert module
    [id] int IDENTITY(1,1) not null, -- The PK of the channel
    [name] nvarchar(255) not null, -- Unique name of the channel
    CONSTRAINT [pk_alert_deliveryChannel_id] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [uq_alert_deliveryChannel_name] UNIQUE ([name])
)
