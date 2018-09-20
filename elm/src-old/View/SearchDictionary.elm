module View.SearchDictionary exposing (view, viewSelectedResultRow)

import Html exposing (..)
import Markdown
import Material.Button as Button
import Material.Card as Card
import Material.Icon as Icon
import Material.LayoutGrid as Grid
import Material.List as List
import Material.Options as Options exposing (cs, css, onClick, onInput, styled, when)
import Material.Textfield as TF
import Model exposing (Model)
import Msg exposing (Msg(..))
import RemoteData exposing (WebData)
import Types exposing (..)


view : Model -> Html Msg
view model =
    let
        state =
            model.dictionarySearchState
    in
    Grid.view []
        [ Grid.cell
            [ Grid.span4 ]
            [ styled Html.div
                []
                [ TF.view Mdc
                    "query-input"
                    model.mdc
                    [ onInput SetDictLookupQuery
                    , Options.id "query-input"
                    , TF.autofocus
                    , TF.label "Lookup words"
                    , TF.value state.lookupQuery
                    ]
                    []
                ]
            , allPaliLetterButtons model
            , Html.div [] [ viewLookupResults state.lookupResults model ]
            ]
        , Grid.cell
            [ Grid.span8 ]
            [ Html.div [] [ List.ul [] (List.map (\x -> viewSelectedResultRow x model) state.selectedWordsList) ] ]
        ]


allPaliLetterButtons model =
    styled Html.div
        []
        (List.map (\x -> paliLetterButton x model) (String.words "ā ī ū ṃ ṅ ñ ṭ ḍ ṇ ḷ"))


paliLetterButton : String -> Model -> Html Msg
paliLetterButton letter model =
    Button.view Mdc
        ("letter-" ++ letter)
        model.mdc
        [ Options.onClick (AddToDictInput letter)
        , css "font-size" "1.2rem"
        , css "text-transform" "lowercase"
        ]
        [ text letter ]


viewLookupResults : WebData (List DictWord) -> Model -> Html Msg
viewLookupResults results model =
    case results of
        RemoteData.NotAsked ->
            Html.div [] []

        RemoteData.Loading ->
            Html.div [] [ text "loading" ]

        RemoteData.Failure _ ->
            Html.div [] [ text "O NOES" ]

        RemoteData.Success res ->
            List.ul [] (List.map (\x -> viewLookupResultRow x model) res)


viewLookupResultRow : DictWord -> Model -> Html Msg
viewLookupResultRow dictWord model =
    let
        words =
            String.words dictWord.summary

        summary =
            if List.length words > 10 then
                String.join " " (List.take 10 words) ++ "..."

            else
                String.join " " words
    in
    Grid.view
        [ cs "hover-gray"
        , css "padding" "0.5em"
        , onClick (AddToSelectedResults dictWord)
        ]
        [ Grid.cell
            [ Grid.span4 ]
            [ styled Html.div
                [ css "font-weight" "bold" ]
                [ text dictWord.word ]
            ]
        , Grid.cell [ Grid.span4 ]
            [ styled Html.div
                [ css "padding-left" "1em" ]
                [ text summary ]
            ]
        ]


viewSelectedResultRow : DictWord -> Model -> Html Msg
viewSelectedResultRow dictWord model =
    Card.view
        [ css "margin" "20px"
        , css "width" "100%"
        ]
        [ styled Html.div [] [ text dictWord.word ]
        , styled Html.div
            [ css "display" "flex"
            , css "flex-direction" "row"
            ]
            [ styled Html.div
                [ css "margin" "auto"
                , css "padding" "0 2rem 0 0"
                , css "flex-grow" "1"
                , css "text-align" "left"
                ]
                [ text dictWord.grammar ]
            , styled Html.div
                [ css "margin" "auto"
                , css "padding" "0"
                , css "flex-grow" "2"
                , css "text-align" "right"
                ]
                [ text ("Source: " ++ dictWord.entry_source) ]
            ]
        , styled Html.div
            [ css "padding-bottom" "1rem" ]
            [ text dictWord.summary ]
        , styled Html.div [] <|
            Markdown.toHtml mdRawHtml dictWord.definition
        , Card.actions []
            [ Button.view Mdc
                "close-button"
                model.mdc
                [ Button.icon "close"
                , Button.ripple
                , Options.onClick (RemoveFromSelectedResults dictWord)
                ]
                []
            ]
        ]
