MERGE INTO [alert].[status] AS target
USING
    (VALUES
        ('REQUESTED'),
        ('QUEUED'),
        ('PROCESSING'),
        ('DELIVERED'),
        ('FAILED'),
        ('CANCELED'),
        ('RESUBMITTED'),
        ('UNAPPROVED')
    ) AS source ([name])
ON target.[name] = source.[name]
WHEN NOT MATCHED BY TARGET THEN
INSERT ([name])
VALUES ([name]);