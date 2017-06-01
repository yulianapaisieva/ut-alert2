ALTER PROCEDURE [alert].[template.fetch] -- returns a template for specific channel and language
    @channel nvarchar(255), -- the channel
    @name nvarchar(200), -- the template name/key,
    @languageCode varchar(2) -- the language
AS
BEGIN TRY
    SELECT 'templates' resultSetName;
    SELECT
        i.itemName AS [name],
        l.iso2Code AS [language],
        itp.name AS [type],
        l.name AS [languageName],
        l.locale as [locale],
        it.itemNameTranslation AS [content]
    FROM [core].[itemTranslation] it
    JOIN [core].[itemName] i ON it.itemNameId = i.itemNameId AND i.itemName = @name
    JOIN [core].[itemType] itp ON i.itemTypeId = itp.itemTypeId
    JOIN [alert].[deliveryChannelItemType] dci ON dci.itemTypeId = itp.itemTypeId
    JOIN [alert].[deliveryChannel] dc ON dci.channelId = dc.id AND dc.name = @channel
    JOIN [core].[language] l ON it.languageId = l.languageId AND l.iso2Code = @languageCode;
END TRY
BEGIN CATCH
    EXEC core.error
END CATCH
