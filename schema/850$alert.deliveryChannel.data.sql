MERGE INTO [alert].[deliveryChannel] AS target
USING
    (VALUES
        ('sms'),
        ('email'),
        ('push')
    ) AS source ([name])
ON target.[name] = source.[name]
WHEN NOT MATCHED BY TARGET THEN
INSERT ([name])
VALUES ([name]);
